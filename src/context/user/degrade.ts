import { ContextMenuCommandBuilder, GuildMember, UserContextMenuCommandInteraction } from "discord.js";
import { responseFrom } from "../../actions/randomResponses";
import data from "../../data";
import { backfireResponse } from "../../actions/backfire";

const command = new ContextMenuCommandBuilder()
    .setName("Degrade")
    .setDMPermission(false);


const callback = async (interaction: UserContextMenuCommandInteraction) => {
    const user = interaction.options.getUser("user") || interaction.user;
    let target = interaction.guild!.members.cache.get(user.id) as GuildMember;

    let message = "";

    // If the user is a sub, have a chance of degrading themselves
    const userRoles = interaction.guild?.members.cache.get(interaction.user.id)?.roles.cache.map(role => role.id);
    if (userRoles?.some(role => data.roles.sub.includes(role))) {
        // Add a slim chance of the sub being punished
        const backfire = Math.random() < 0.25;
        if (backfire) {
            message = backfireResponse(target.id);
            target = interaction.guild!.members.cache.get(interaction.user.id) as GuildMember;
        }
    }

    let id = target.id;
    if (target.id === interaction.guild?.members.me!.id) id = interaction.user.id;

    const response = responseFrom(target as GuildMember, "degrade");

    await interaction.reply(`${message}<@${id}>\n\n${response}`);
};

export { command, callback };
