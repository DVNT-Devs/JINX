import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "@discordjs/builders";
import { ButtonStyle, CommandInteraction } from "discord.js";
import { Colours } from "../../utils/data";

export default async function (interaction: CommandInteraction, title: string, text: string): Promise<boolean | null> {
    await interaction.editReply({ embeds: [new EmbedBuilder()
        .setTitle(title)
        .setDescription(text)
        .setColor(Colours.Warning)
    ], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("confirm").setLabel("Yes").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("cancel").setLabel("No").setStyle(ButtonStyle.Danger)
    )]});
    let i;
    try {
        i = await interaction.channel?.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id && i.message.interaction?.id === interaction.id,
            time: 60000 * 5
        });
    } catch (e) { return null; }
    if (!i) { return null; }
    await i.deferUpdate();
    const customId = i.customId;
    return customId === "confirm";
}
