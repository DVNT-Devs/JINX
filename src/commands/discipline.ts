import { EmbedBuilder } from "@discordjs/builders";
import { CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Colours } from "../data";
import DB from "../database/drizzle";
import { relationships } from "../database/schema";
import { eq, or } from "drizzle-orm";

const discipline = new SlashCommandBuilder()
    .setName("discipline")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDescription("Give discipline to a member");

const callback = async (interaction: CommandInteraction) => {
    const db = await DB;

    // Find every record where either the dom or sub is the user
    const userId = interaction.user.id;
    const rows = await db.select()
        .from(relationships)
        .where(or(
            eq(relationships.dom, userId),
            eq(relationships.sub, userId)
        ));
    // Find the list of dom IDs where the user is the sub
    const doms = rows.filter(row => row.sub === userId);
    const subs = rows.filter(row => row.dom === userId);
    const doms_accepted = doms.filter(row => row.accepted).map(row => row.dom);
    const subs_accepted = subs.filter(row => row.accepted).map(row => row.sub);

    await interaction.reply({embeds: [new EmbedBuilder()
        .setTitle("Discipline")
        .setDescription(
            `Welcome, @${interaction.user.username}!\n\n` +
            `You have ${doms_accepted.length} doms (${doms.length - doms_accepted.length} pending) and ` +
            `${subs_accepted.length} subs (${subs.length - subs_accepted.length} pending).`
        )
        .setColor(Colours.Danger)
    ], ephemeral: true});
};

export { discipline as command, callback };
