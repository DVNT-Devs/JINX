import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { ButtonStyle, CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";


const dev = new SlashCommandBuilder()
    .setName("dev")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDescription("Please don't use this command!");


const callback = async (interaction: CommandInteraction) => {
    await interaction.channel!.send({components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("global:onboard")
                .setLabel("global:onboard")
                .setStyle(ButtonStyle.Primary),
            // new ButtonBuilder()
            //     .setCustomId("global:rules")
            //     .setLabel("global:rules")
            //     .setStyle(ButtonStyle.Primary),
            // new ButtonBuilder()
            //     .setCustomId("global:secret")
            //     .setLabel("Share a Secret")
            //     .setStyle(ButtonStyle.Danger)
        )
    ]});
};

export {
    dev as command,
    callback
};
