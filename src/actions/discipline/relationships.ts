import { ButtonStyle, CommandInteraction } from "discord.js";
import { Data as DisciplineData, ModuleReturnData, plural } from "../../commands/discipline";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, SelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder } from "@discordjs/builders";
import { Colours } from "../../utils/data";
import DB from "../../database/drizzle";
import { relationships } from "../../database/schema";
import { and, eq } from "drizzle-orm";


const userList = (list: string[]) => list.map((u) => `<@${u}>`).join(", ");

export default async function (interaction: CommandInteraction, data: DisciplineData): Promise<ModuleReturnData> {
    const breakOut = false;
    let lastClicked = "";
    const usernameOf = (id: string) => interaction.guild?.members.cache.get(id)?.user.username || "Unknown";
    const displayNameOf = (id: string) => interaction.guild?.members.cache.get(id)?.displayName || "Unknown";
    let message: string | null = null;

    do {
        const selectedComponent: ActionRowBuilder<UserSelectMenuBuilder | StringSelectMenuBuilder>[] = [];
        switch (lastClicked) {
            case "inviteDom": {
                selectedComponent.push(new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
                    new UserSelectMenuBuilder()
                        .setCustomId("inviteDomSU")
                        .setPlaceholder("Select a user to invite as your dom")
                        .setDisabled(data.domsAccepted.length >= 25)  // Discord limit
                ));
                break;
            } case "removeDom": {
                selectedComponent.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                    new SelectMenuBuilder()
                        .setCustomId("removeDomSS")
                        .setPlaceholder("Select a dom you do not want to have control over you")
                        .addOptions(data.domsAccepted.slice(0, 24).map((m) => new StringSelectMenuOptionBuilder()
                            .setLabel(displayNameOf(m))
                            .setDescription(usernameOf(m))
                            .setValue(m)
                        ) || {label: "No doms", value: "none"})
                        .setDisabled(!data.domsAccepted.length)
                        .setMaxValues(data.domsAccepted.length)
                ));
                break;
            } case "removeSub": {
                selectedComponent.push(new ActionRowBuilder<SelectMenuBuilder>().addComponents(
                    new SelectMenuBuilder()
                        .setCustomId("removeSubSS")
                        .setPlaceholder("Select a sub you no longer want to have control over")
                        .addOptions(data.subsAccepted.slice(0, 24).map((m) => new StringSelectMenuOptionBuilder()
                            .setLabel(displayNameOf(m))
                            .setDescription(usernameOf(m))
                            .setValue(m)
                        ) || {label: "No subs", value: "none"})
                        .setDisabled(!data.subsAccepted.length)
                        .setMaxValues(data.subsAccepted.length)
                ));
                break;
            } case "cancelInvite": {
                selectedComponent.push(new ActionRowBuilder<SelectMenuBuilder>().addComponents(
                    new SelectMenuBuilder()
                        .setCustomId("cancelInviteSS")
                        .setPlaceholder("Choose a dom you no longer want to invite")
                        .addOptions(data.domsPending.slice(0, 24).map((m) => new StringSelectMenuOptionBuilder()
                            .setLabel(displayNameOf(m))
                            .setDescription(usernameOf(m))
                            .setValue(m)
                        ) || {label: "No pending invites", value: "none"})
                        .setDisabled(!data.domsPending.length)
                        .setMaxValues(data.domsPending.length)
                ));
                break;
            } case "acceptSub": {
                selectedComponent.push(new ActionRowBuilder<SelectMenuBuilder>().addComponents(
                    new SelectMenuBuilder()
                        .setCustomId("acceptSubSS")
                        .setPlaceholder("Choosing a sub will accept them as yours")
                        .addOptions(data.subsPending.slice(0, 24).map((m) => new StringSelectMenuOptionBuilder()
                            .setLabel(displayNameOf(m))
                            .setDescription(usernameOf(m))
                            .setValue(m)
                        ) || {label: "No pending invites", value: "none"})
                        .setMaxValues(data.subsPending.length)
                ));
                break;
            } case "rejectSub": {
                selectedComponent.push(new ActionRowBuilder<SelectMenuBuilder>().addComponents(
                    new SelectMenuBuilder()
                        .setCustomId("rejectSubSS")
                        .setPlaceholder("Selecting a sub will ignore their request")
                        .addOptions(data.subsPending.slice(0, 24).map((m) => new StringSelectMenuOptionBuilder()
                            .setLabel(displayNameOf(m))
                            .setDescription(usernameOf(m))
                            .setValue(m)
                        ) || {label: "No pending invites", value: "none"})
                        .setMaxValues(data.subsPending.length)
                ));
                break;
            }
        }

        const components: ActionRowBuilder<
            ButtonBuilder |
            UserSelectMenuBuilder |
            StringSelectMenuBuilder
        >[] = [new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("back")
                .setLabel("Back")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("inviteDom")
                .setLabel("Invite Dom")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(data.domsAccepted.length >= 25)  // Discord limit
        )];
        if (data.domsAccepted.length) {
            components[0]?.components.push(new ButtonBuilder()
                .setCustomId("removeDom")
                .setLabel("Remove Dom")
                .setStyle(ButtonStyle.Danger)
            );
        }
        if (data.subsAccepted.length) {
            components[0]?.components.push(new ButtonBuilder()
                .setCustomId("removeSub")
                .setLabel("Remove Sub")
                .setStyle(ButtonStyle.Danger)
            );
        }
        const adaptive = new ActionRowBuilder<ButtonBuilder>();
        // If any subs are inviting the user, add a button to accept them
        if (data.subsPending.length) {
            adaptive.addComponents(new ButtonBuilder()
                .setCustomId("acceptSub")
                .setLabel("Accept Sub")
                .setStyle(ButtonStyle.Success)
            );
            adaptive.addComponents(new ButtonBuilder()
                .setCustomId("rejectSub")
                .setLabel("Reject Sub")
                .setStyle(ButtonStyle.Danger)
            );
        }
        // If the user is inviting any doms, add a button to cancel the invite
        if (data.domsPending.length) {
            adaptive.addComponents(new ButtonBuilder()
                .setCustomId("cancelInvite")
                .setLabel("Cancel Outgoing Invite")
                .setStyle(ButtonStyle.Primary)
            );
        }
        if (adaptive.components.length) components.push(adaptive);
        components.push(...selectedComponent);

        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setTitle("Relationships")
            .setDescription(
                `**Doms:** You have ${plural(data.domsAccepted.length, "dom")}` + (data.domsAccepted.length ? `\n> ${userList(data.domsAccepted)}` : "") + "\n" +
                `**Subs:** You have ${plural(data.subsAccepted.length, "sub")}` + (data.subsAccepted.length ? `\n> ${userList(data.subsAccepted)}` : "") + "\n\n" +
                (data.domsPending.length ? `**Outgoing Invites to Doms:**\n> ${userList(data.domsPending.slice(0, 24))}\n` : "") +
                (data.subsPending.length ? `**Incoming Requests From Subs:**\n> ${userList(data.subsPending.slice(0, 24))}\n` : "")
            )
            .setColor(Colours.Danger)
            .setFooter({text: message ?? "Select an action to take"})
        ], components});
        message = null;
        let i;
        try {
            i = await interaction.channel?.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id && i.message.interaction?.id === interaction.id,
                time: 60000 * 5
            });
        } catch (e) { return {persist: false, data: data}; }
        if (!i) { return {persist: false, data: data}; }
        await i.deferUpdate();
        const customId = i.customId;
        lastClicked = customId;
        switch (customId) {
            case "back": { return {persist: false, data: data}; }
        }
        // If the customId is inviteDomSU, removeDomSS, cancelInviteSS, or removeSubSS, it's much easier
        if (i.isStringSelectMenu() || i.isUserSelectMenu()) {
            let dataOut: DisciplineData | undefined, messageOut;
            for (const member of i.values) {
                switch (customId) {
                    case "inviteDomSU": {
                        // Send an invite to the selected user
                        [dataOut, messageOut] = await sendInviteToDom(member, interaction.user.id, data);
                        break;
                    } case "removeDomSS": {
                        // Removes a dom from the user's list
                        [dataOut, messageOut] = await removeDomOrCancelInvite(member, interaction.user.id, data);
                        break;
                    } case "removeSubSS": {
                        // Removes a sub from the user's list
                        [dataOut, messageOut] = await removeSubOrRejectInvite(member, interaction.user.id, data);
                        break;
                    } case "cancelInviteSS": {
                        // Cancels an invite sent to a dom by the user
                        [dataOut, messageOut] = await removeDomOrCancelInvite(member, interaction.user.id, data);
                        break;
                    } case "acceptSubSS": {
                        // Accepts a sub's request to be the user's sub
                        [dataOut, messageOut] = await acceptSub(member, interaction.user.id, data);
                        break;
                    } case "rejectSubSS": {
                        // Rejects a sub's request to be the user's sub
                        [dataOut, messageOut] = await removeSubOrRejectInvite(member, interaction.user.id, data);
                        break;
                    }
                }
                data = dataOut!;
                message = messageOut!;
            }
        }
    } while (!breakOut);
    return {persist: true, data: data};
}

async function sendInviteToDom(dom: string, sub: string, data: DisciplineData): Promise<[DisciplineData, string]> {
    // Check if user is already a dom, or if they are pending
    if (data.domsAccepted.includes(dom)) return [data, "This user is already your dom"];
    if (data.domsPending.includes(dom)) return [data, "You have already invited this user"];

    // Load the database
    const db = await DB;
    await db.insert(relationships).values({dom, sub, accepted: false});

    // Add to the list
    data.domsPending.push(dom);

    return [data, "Member was invited to be your dom - You'll need to ask them to accept the invite"];
}

async function removeDomOrCancelInvite(dom: string, sub: string, data: DisciplineData): Promise<[DisciplineData, string]> {
    // This is the same for removing a dom or cancelling an invite - All that's different is the accepted boolean
    data.domsAccepted = data.domsAccepted.filter((u) => u !== dom);
    data.domsPending = data.domsPending.filter((u) => u !== dom);
    // Remove from the database
    const db = await DB;
    await db.delete(relationships).where(and(eq(relationships.dom, dom), eq(relationships.sub, sub)));
    return [data, "Dom was removed from your list"];
}

async function removeSubOrRejectInvite(sub: string, dom: string, data: DisciplineData): Promise<[DisciplineData, string]> {
    data.subsAccepted = data.subsAccepted.filter((u) => u !== sub);
    data.subsPending = data.subsPending.filter((u) => u !== sub);
    // Remove from the database
    const db = await DB;
    await db.delete(relationships).where(and(eq(relationships.dom, dom), eq(relationships.sub, sub)));
    return [data, "Sub was removed from your list"];
}

async function acceptSub(sub: string, dom: string, data: DisciplineData): Promise<[DisciplineData, string]> {
    // Check if user is already a sub
    if (data.subsAccepted.includes(sub)) return [data, "This user is already your sub"];

    // Load the database
    const db = await DB;
    await db.update(relationships).set({accepted: true}).where(and(eq(relationships.dom, dom), eq(relationships.sub, sub)));

    // Add to the list
    data.subsAccepted.push(sub);
    data.subsPending = data.subsPending.filter((u) => u !== sub);

    return [data, "Member was accepted as your sub"];
}
