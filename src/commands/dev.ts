import { join } from "path";
import { CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { readFile } from "fs/promises";
import { migrateFromJson } from "../actions/secrets";

const dev = new SlashCommandBuilder()
    .setName("dev")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDescription("Please don't use this command!");


const commitPath = join(__dirname, "..", "commit.txt");

const callback = async (interaction: CommandInteraction) => {
    // Read the ~/commit.txt file
    const info = (await readFile(commitPath, "utf-8")).split("\n");
    const [ commit, author ] = info.map(i => i.split(" "));
    const hash = commit!.shift();
    const message = commit!.join(" ");
    await interaction.reply({
        content: `The current commit is: \`${hash}\`\n` +
            `> ${message}\n` +
            `> by ${author!.join(" ")}`,
        ephemeral: true });
    await migrateFromJson();
};

export {
    dev as command,
    callback
};
