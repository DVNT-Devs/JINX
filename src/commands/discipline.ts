import { EmbedBuilder } from "@discordjs/builders";
import { CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Colours } from "../data";
// import DB from "../database/drizzle";
// import { users } from "../database/schema";

const discipline = new SlashCommandBuilder()
    .setName("discipline")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDescription("Give discipline to a member");

const callback = async (interaction: CommandInteraction) => {
    // const db = await DB;
    await interaction.reply({embeds: [new EmbedBuilder()
        .setTitle("Discipline")
        .setColor(Colours.Success)
    ], ephemeral: true});
};

export { discipline as command, callback };
