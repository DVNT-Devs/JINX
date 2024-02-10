import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "@discordjs/builders";
import { ButtonStyle, CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Colours } from "../data";
import DB from "../database/drizzle";
import { punishments, relationships } from "../database/schema";
import { eq, inArray, or } from "drizzle-orm";
import invites from "../actions/discipline/invites";

const discipline = new SlashCommandBuilder()
    .setName("discipline")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDescription("Give discipline to a member");


export interface Data {
    domsAccepted: string[];
    subsAccepted: string[];
    domsPending: number;
    subsPending: number;
    punishedByOthers: typeof punishments.$inferSelect[];
    punishedByMe: typeof punishments.$inferSelect[];
}

const callback = async (interaction: CommandInteraction) => {
    const db = await DB;
    await interaction.deferReply({ephemeral: true});
    const userId = interaction.user.id;

    let refresh = true;
    let breakOut = false;

    const data: Data = {
        domsAccepted: [],
        subsAccepted: [],
        domsPending: 0,
        subsPending: 0,
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
            data.domsPending = doms.length - data.domsAccepted.length;
            data.subsPending = subs.length - data.subsAccepted.length;

            // Find any punishments where the user is the sub_id
            const punishmentsQuery = await db.select()
                .from(punishments)
                .where(eq(punishments.sub, userId));
            data.punishedByOthers = punishmentsQuery;
            // And find any where the sub_id is in subsAccepted
            data.punishedByMe = await db.select()
                .from(punishments)
                .where(inArray(punishments.sub, data.subsAccepted));
            refresh = false;
        }

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("invites")
                .setLabel("Invites")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("relationships")
                .setLabel("Relationships")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("punishments")
                .setLabel("Give Punishment")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("challenge")
                .setLabel("Challenge")
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.editReply({embeds: [new EmbedBuilder()
            .setTitle("Discipline")
            .setDescription(
                `Welcome, @${interaction.user.username}!\n\n` +
                `You have ${data.domsAccepted.length} doms (${data.domsPending} pending) and ` +
                `${data.subsAccepted.length} subs (${data.subsPending} pending)`
            )
            .setColor(Colours.Danger)
        ], components: [buttons]});

        let i;
        try {
            i = await interaction.channel?.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id,
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
        case "invites": {
            if(! await invites(interaction, data)) break;
            break;
        }}
    } while (breakOut);
    await interaction.editReply({embeds: [new EmbedBuilder()
        .setTitle("Discipline")
        .setDescription("Command timed out | Run /discipline to use the command again")
    ], components: []});
};

export { discipline as command, callback };
