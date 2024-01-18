import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { ButtonStyle, SlashCommandBuilder } from "discord.js";


const dev = new SlashCommandBuilder()
    .setName("dev")
    .setDescription("Please don't use this command!");


const callback = async (interaction: any) => {
    await interaction.reply({components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder()
            .setCustomId("global:onboard")
            .setLabel("Onboard")
            .setStyle(ButtonStyle.Primary)
        )
    ]});
};

export {
    dev as command,
    callback
};
