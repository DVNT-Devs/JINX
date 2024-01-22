import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";

import { responseFrom } from "../actions/randomResponses";


const insult = new SlashCommandBuilder()
    .setName("degrade")
    .setDescription("Degrade a fellow member, or yourself")
    .addStringOption(option => option
        .setName("type")
        .setDescription("The type of insult to use | Default: ")
        .addChoices(
            { name: "Degradation", value: "degrade" },
            { name: "Mean", value: "mean" }
        ).setRequired(false)
    )
    .addUserOption(option => option.setName("user").setDescription("The user to insult | Default: Yourself").setRequired(false));


const callback = async (interaction: CommandInteraction) => {
    const user = interaction.options.getUser("user") || interaction.user;
    const target = interaction.guild!.members.cache.get(user.id) as GuildMember;
    let id = target.id;
    if (target.id === interaction.guild?.members.me!.id) id = interaction.user.id;
    const insultType = (interaction.options.get("type")?.value) as "mean" | "degrade" || "degrade";

    const response = responseFrom(target as GuildMember, insultType);

    interaction.reply(`<@${id}>\n\n${response}`);
};


export {
    insult as command,
    callback
};
