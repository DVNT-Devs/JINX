import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";

import { responseFrom } from "../actions/randomResponses";


const praise = new SlashCommandBuilder()
    .setName("praise")
    .setDescription("Praise a fellow member, or yourself")
    .addUserOption(option => option.setName("user").setDescription("The user to praise | Default: Yourself").setRequired(false));


const callback = async (interaction: CommandInteraction) => {
    const user = interaction.options.getUser("user") || interaction.user;
    const target = interaction.guild!.members.cache.get(user.id) as GuildMember;
    let id = target.id;
    if (target.id === interaction.guild?.members.me!.id) id = interaction.user.id;

    const response = responseFrom(target as GuildMember, "praise");

    interaction.reply(`<@${id}>\n\n${response}`);
};


export {
    praise as command,
    callback
};
