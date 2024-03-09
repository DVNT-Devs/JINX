import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import data from "../utils/data";

import { responseFrom } from "../actions/randomResponses";
import { backfireResponse } from "../actions/backfire";


const praise = new SlashCommandBuilder()
    .setName("praise")
    .setDescription("Praise a fellow member, or yourself")
    .setNSFW(true)
    .addUserOption(option => option.setName("user").setDescription("The user to praise | Default: Yourself").setRequired(false));


const callback = async (interaction: CommandInteraction) => {
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

    void interaction.reply(`${message}<@${id}>\n\n${response}`);
};


export {
    praise as command,
    callback
};
