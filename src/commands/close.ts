import { EmbedBuilder } from "@discordjs/builders";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Colours } from "../utils/data";
import { handleThreadClose } from "../actions/tickets";

const close = new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close the current ticket")
    .addStringOption(option => option
        .setName("reason")
        .setDescription("The reason for closing the ticket")
        .setRequired(false)
    );

const callback = async (interaction: CommandInteraction) => {
    // Check if the current channel is a thread
    if (!interaction.channel?.isThread()) {
        await interaction.reply({ embeds: [new EmbedBuilder()
            .setTitle("Error")
            .setDescription("This command can only be used in a thread")
            .setColor(Colours.Danger)
        ] });
        return;
    }
    await handleThreadClose(interaction, interaction.options.get("reason")?.value as string | undefined);
};

export {
    close as command,
    callback
};
