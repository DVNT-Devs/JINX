import { ContextMenuCommandBuilder, GuildMember, UserContextMenuCommandInteraction } from "discord.js";
import { responseFrom } from "../../actions/randomResponses";
import data from "../../data";
import { backfireResponse } from "../../actions/backfire";

const command = new ContextMenuCommandBuilder()
    .setName("Praise")
    .setDMPermission(false);

const callback = async (interaction: UserContextMenuCommandInteraction) => {
    const user = interaction.options.getUser("user") || interaction.user;
    let target = interaction.guild!.members.cache.get(user.id) as GuildMember;

    let message = "";
    // Check if the target is exempt from being praised
    if (data.exemptions.praise.includes(target.id)) {
        message = backfireResponse(target.id, "praise");
        target = interaction.guild!.members.cache.get(interaction.user.id) as GuildMember;
    }

    let id = target.id;
    if (target.id === interaction.guild?.members.me!.id) id = interaction.user.id;

    const response = responseFrom(target as GuildMember, "praise");

    await interaction.reply(`${message}<@${id}>\n\n${response}`);
};

export { command, callback };
