import { ButtonInteraction, ButtonStyle, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, PermissionFlagsBits, StringSelectMenuInteraction, User } from "discord.js";
import { contentRestrictions, Colours } from "../../utils/data";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders";

const command = new ContextMenuCommandBuilder()
    .setName("FAQ")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false);


const replacement = (str: string, user: User) => {
    return str
        .replaceAll("*{userId}", user.id);
};

const callback = async (interaction: MessageContextMenuCommandInteraction) => {
    const m = await interaction.deferReply({ ephemeral: true, fetchReply: true });

    const faq = contentRestrictions.faq;

    let readyToSend = false;
    let breakOut = false;
    let chosenQuestion: number | undefined;

    while (!breakOut) {
        const faqSelectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder()
            .setCustomId("faqSelectMenu")
            .setPlaceholder("Select a response to send")
            .addOptions(Object.values(faq).map((prompt, index) => new StringSelectMenuOptionBuilder()
                .setLabel(prompt.name)
                .setDescription(prompt.description)
                .setValue(index.toString())
                .setDefault(index === chosenQuestion)
            ))
        );

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("cancelButton")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("sendButton")
                .setLabel("Send")
                .setStyle(ButtonStyle.Success)
                .setDisabled(!(chosenQuestion !== undefined))
        );

        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setTitle("FAQ")
            .setDescription(
                `You have selected [this message](${interaction.targetMessage.url}) by <@${interaction.targetMessage.author.id}>.\n` +
                "Select a FAQ entry to send.\n\n" +
                `**Current output:** ${chosenQuestion === undefined ? "*none*" : `\n>>> ${
                    replacement(faq[chosenQuestion]!.text.join("\n"), interaction.targetMessage.author)
                }`}`
            )
            .setColor(Colours.Warning)
        ], components: [faqSelectMenu, buttons]});

        let i: StringSelectMenuInteraction | ButtonInteraction;
        try {
            i = await m.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id && m.id === i.message.id,
                time: 60000 * 5
            }) as typeof i;
        } catch (e) {
            return;
        }
        await i.deferUpdate();
        if (i.isButton()) {
            if (i.customId === "sendButton") {
                readyToSend = true;
            }
            breakOut = true;
        } else if (i.isStringSelectMenu()) {
            chosenQuestion = parseInt(i.values[0]!);
        }
    }
    if (readyToSend) {
        await interaction.channel?.send({
            content: replacement(faq[chosenQuestion!]!.text.join("\n"), interaction.targetMessage.author),
            components: [],
            reply: { messageReference: interaction.targetMessage.id }
        });
        await interaction.deleteReply();
    } else {
        await interaction.editReply({embeds: [new EmbedBuilder()
            .setTitle("FAQ")
            .setDescription("No action was taken - Operation cancelled")
            .setColor(Colours.Warning)
        ], components: []});
    }
};

export { command, callback };
