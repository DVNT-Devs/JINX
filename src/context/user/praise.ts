import { ContextMenuCommandBuilder, GuildMember, UserContextMenuCommandInteraction } from "discord.js";
import { responseFrom } from "../../actions/randomResponses";

const command = new ContextMenuCommandBuilder()
    .setName("Praise")
    .setDMPermission(false);

const callback = async (interaction: UserContextMenuCommandInteraction) => {
    const user = interaction.options.getUser("user") || interaction.user;
    const target = interaction.guild!.members.cache.get(user.id) as GuildMember;
    let id = target.id;
    if (target.id === interaction.guild?.members.me!.id) id = interaction.user.id;

    const response = responseFrom(target as GuildMember, "praise");

    await interaction.reply(`<@${id}>\n\n${response}`);
};

export { command, callback };
