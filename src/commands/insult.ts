import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";

import { responseFrom } from "../actions/randomResponses";


const insult = new SlashCommandBuilder()
    .setName("insult")
    .setDescription("Insult a fellow member, or yourself")
    .addUserOption(option => option.setName("user").setDescription("The user to insult | Default: Yourself").setRequired(false))
    .addStringOption(option => option
        .setName("type")
        .setDescription("The type of insult to use | Default: ")
        .addChoices(
            { name: "Mean", value: "mean" },
            { name: "Degradation", value: "degrade" }
        )
    );


const callback = async (interaction: CommandInteraction) => {
    const user = interaction.options.getUser("user") || interaction.user;
    const target = interaction.guild!.members.cache.get(user.id) as GuildMember;
    const insultType: "mean" | "degrade" = (interaction.options.get("type")?.value) as unknown as "mean" | "degrade" || "mean";

    const response = responseFrom(target as GuildMember, insultType);

    interaction.reply(`<@${target.id}>\n\n${response}`);
};


export {
    insult as command,
    callback
};
