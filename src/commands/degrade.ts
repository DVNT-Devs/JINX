import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import data from "../data";

import { responseFrom } from "../actions/randomResponses";
import { backfireResponse } from "../actions/backfire";


const insult = new SlashCommandBuilder()
    .setName("degrade")
    .setDescription("Degrade a fellow member, or yourself")
    .addUserOption(option => option.setName("user").setDescription("The user to insult | Default: Yourself").setRequired(false))
    .addStringOption(option => option
        .setName("type")
        .setDescription("The type of insult to use | Default: Degrade")
        .addChoices(
            { name: "Degradation", value: "degrade" },
            { name: "Mean", value: "mean" }
        ).setRequired(false)
    );


const callback = async (interaction: CommandInteraction) => {
    const user = interaction.options.getUser("user") || interaction.user;
    let target = interaction.guild!.members.cache.get(user.id) as GuildMember;
    let message = "";

    // If the user is a sub, have a chance of degrading themselves
    const userRoles = interaction.guild?.members.cache.get(interaction.user.id)?.roles.cache.map(role => role.id);
    if (userRoles?.some(role => data.roles.sub.includes(role))) {
        // Add a slim chance of the sub being punished
        const backfire = Math.random() < 0.1;
        if (backfire) {
            message = backfireResponse(target.id);
            target = interaction.guild!.members.cache.get(interaction.user.id) as GuildMember;
        }
    }

    let id = target.id;
    if (target.id === interaction.guild?.members.me!.id) id = interaction.user.id;
    const insultType = (interaction.options.get("type")?.value) as "mean" | "degrade" || "degrade";

    const response = responseFrom(target as GuildMember, insultType);

    void interaction.reply(`${message}<@${id}>\n\n${response}`);
};


export {
    insult as command,
    callback
};
