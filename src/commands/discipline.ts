import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "@discordjs/builders";
import { ButtonStyle, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Colours } from "../data";
import DB from "../database/drizzle";
import { challenges, punishments, relationships } from "../database/schema";
import { eq, inArray, or } from "drizzle-orm";
import relationshipsCallback from "../actions/discipline/relationships";
import confirm from "../actions/discipline/confirm";
import punishment from "../actions/discipline/punishment";


const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
export { plural };

const discipline = new SlashCommandBuilder()
    .setName("discipline")
    // .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDescription("Give discipline to a member");


export interface Data {
    domsAccepted: string[];
    subsAccepted: string[];
    domsPending: string[];
    subsPending: string[];
    punishedByOthers: typeof punishments.$inferSelect[];
    punishedByMe: typeof punishments.$inferSelect[];
}
export interface ModuleReturnData {
    persist: boolean;
    data: Data;
}

const resetAll = async (userId: string) => {
    const db = await DB;
    await db.delete(relationships).where(or(
        eq(relationships.dom, userId),
        eq(relationships.sub, userId)
    ));
    await db.delete(punishments).where(eq(punishments.sub, userId));
    await db.delete(challenges).where(eq(challenges.sub, userId));
};

const notifications = {
    sub: "<:sub:1200811326973431950>",
    dom: "<:dom:1200811331209666600>",
    switch: "<:switch:1200811328735031426>",
};

const callback = async (interaction: CommandInteraction) => {
    const db = await DB;
    await interaction.deferReply({ephemeral: true});
    const userId = interaction.user.id;
    // In the background, fetch all the members of the guild
    await interaction.guild?.members.fetch();

    let refresh = true;
    let breakOut = false;

    let data: Data = {
        domsAccepted: [],
        subsAccepted: [],
        domsPending: [],
        subsPending: [],
        punishedByOthers: [],
        punishedByMe: []
    };
    do {
        // Find every record where either the dom or sub is the user
        if (refresh) {
            const relationshipsQuery = await db.select()
                .from(relationships)
                .where(or(
                    eq(relationships.dom, userId),
                    eq(relationships.sub, userId)
                ));
            // Find the list of dom IDs where the user is the sub
            const doms = relationshipsQuery.filter(row => row.sub === userId);
            const subs = relationshipsQuery.filter(row => row.dom === userId);

            data.domsAccepted = doms.filter(row => row.accepted).map(row => row.dom);
            data.subsAccepted = subs.filter(row => row.accepted).map(row => row.sub);
            data.domsPending = doms.filter(row => !row.accepted).map(row => row.dom);
            data.subsPending = subs.filter(row => !row.accepted).map(row => row.sub);

            // Find any punishments where the user is the sub_id
            const punishmentsQuery = await db.select()
                .from(punishments)
                .where(eq(punishments.sub, userId));
            data.punishedByOthers = punishmentsQuery;
            // And find any where the sub_id is in subsAccepted
            if (data.subsAccepted.length > 0) {
                data.punishedByMe = await db.select()
                    .from(punishments)
                    .where(inArray(punishments.sub, data.subsAccepted));
            }
            refresh = false;
        }

        const buttons = [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId("relationships")
                    .setLabel("Relationships")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji({id: "1168736441749213205"}),
                new ButtonBuilder()
                    .setCustomId("punishments")
                    .setLabel("Punishments")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji({id: "1169338343851557045"})
                    .setDisabled(data.punishedByOthers.length === 0 && data.punishedByMe.length === 0),
                new ButtonBuilder()
                    .setCustomId("challenge")
                    .setLabel("Challenges")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji({id: "1168736435147395252"})
                    .setDisabled(data.punishedByOthers.length === 0 && data.punishedByMe.length === 0),
                new ButtonBuilder()
                    .setCustomId("killSwitch")
                    .setLabel("Opt-out")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(
                        data.domsAccepted.length === 0 && data.subsAccepted.length === 0 &&
                        data.domsPending.length === 0 && data.subsPending.length === 0
                    )
                    .setEmoji({id: "947441948543815720"})
            )
        ];

        // Check if the user has incoming invites
        let invites = "";
        if (data.domsPending.length > 0) {
            invites += `\n\n${notifications.dom} You have ${plural(data.domsPending.length, "outgoing request")} to doms`;
        }
        if (data.subsPending.length > 0) {
            invites += `\n\n${notifications.sub} You have ${plural(data.subsPending.length, "incoming request")} from subs`;
        }

        await interaction.editReply({embeds: [new EmbedBuilder()
            .setTitle("Discipline")
            .setDescription(
                `Welcome, <@${userId}>! Here you can manage your relationships, punishments, and challenges for your doms or subs.` +
                invites
            )
            .setColor(Colours.Danger)
        ], components: buttons});

        let i;
        try {
            i = await interaction.channel?.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id && i.message.interaction?.id === interaction.id,
                time: 60000 * 5
            });
        } catch (e) {
            breakOut = true;
            continue;
        }
        if (!i) {
            breakOut = true;
            continue;
        }
        await i.deferUpdate();
        const customId = i.customId;
        switch (customId) {
            case "killSwitch": {
                if (await confirm(
                    interaction,
                    "Opt-out of discipline",
                    "This will clear all punishments and challenges set for you.\n" +
                    "It also clears any doms / subs you have accepted / pending / invited.\n\n" +
                    "**Are you sure you want to reset everything?**"
                )) await resetAll(interaction.user.id);
                refresh = true;
                break;
            } case "relationships": {
                const out = await relationshipsCallback(interaction, data);
                data = out.data;
                breakOut = out.persist;
                break;
            } case "punishments": {
                const out = await punishment(interaction, data);
                data = out.data;
                breakOut = out.persist;
                break;
            }
        }
    } while (!breakOut);
    await interaction.editReply({embeds: [new EmbedBuilder()
        .setTitle("Discipline")
        .setDescription("Command timed out | Run /discipline to use the command again")
    ], components: []});
};

export { discipline as command, callback };
