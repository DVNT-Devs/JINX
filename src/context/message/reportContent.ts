import { ButtonInteraction, ButtonStyle, ChannelType, ContextMenuCommandBuilder, Message, MessageContextMenuCommandInteraction, PermissionFlagsBits, TextInputStyle } from "discord.js";
import { contentRestrictions, Colours } from "../../utils/data";
import { ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, EmbedBuilder, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder } from "@discordjs/builders";
import dualCollector from "../../utils/dualCollector";

const command = new ContextMenuCommandBuilder()
    .setName("Report Content")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false);


const guidelines = (channel: string) => `📍 Follow content guidelines in the [pinned post](<${channel}>)`;


const callback = async (interaction: MessageContextMenuCommandInteraction) => {
    const m = await interaction.deferReply({ ephemeral: true, fetchReply: true });
    // Check if the message is in a channel with content restrictions
    const channel = interaction.channel!;
    if (!Object.keys(contentRestrictions.reports).includes(channel.id)) {
        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setTitle("Unrestricted Channel")
            .setDescription(`This channel (<#${channel.id}>) does not have content guidelines associated with it.
                If you believe this is an error, please contact <@438733159748599813>.`
            )
            .setColor(Colours.Danger)
        ] });
        return;
    }
    const ruleList = generateRuleList(channel.id);

    let readyToSend = false;
    let breakOut = false;
    let chosenRule: number | undefined;
    let suggestedChannel: string | undefined;

    let message = "";
    let refreshMessage: boolean | null = true;

    while (!breakOut) {
        if (refreshMessage) {
            message = generateMessage(interaction.targetMessage.author.id, chosenRule, suggestedChannel, ruleList, false);
            refreshMessage = null;
        }

        const ruleSelectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder()
            .setCustomId("ruleSelectMenu")
            .setPlaceholder("Select a rule this message breaks")
            .addOptions(ruleList.map((rule, index) => new StringSelectMenuOptionBuilder()
                .setLabel(rule.substring(0, 97) + (rule.length > 97 ? "..." : ""))
                .setValue(index.toString())
                .setDefault(index === chosenRule)
            ))
        );
        const channelSelectMenu = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(new ChannelSelectMenuBuilder()
            .setCustomId("channelSelectMenu")
            .setPlaceholder("Choose where this content fits better")
            .setChannelTypes(ChannelType.GuildText)
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
                .setDisabled((chosenRule === undefined) && !(suggestedChannel)),
            new ButtonBuilder()
                .setCustomId("modifyText")
                .setLabel("Modify message")
                .setStyle(ButtonStyle.Secondary)
        );

        const embed = new EmbedBuilder()
            .setTitle("Report Content")
            .setDescription(
                `You have selected [this message](${interaction.targetMessage.url}) by <@${interaction.targetMessage.author.id}>.\n` +
                "You can select a rule this message breaks, and optionally suggest a channel to move it to.\n" +
                `**Current rule selected:** ${chosenRule !== undefined ? ruleList[chosenRule] : "*None*"}\n` +
                `**Current suggested channel:** ${suggestedChannel ? `<#${suggestedChannel}>` : "*None*"}\n\n` +
                `**Message Preview:**\n>>> ${message}`
            )
            .setColor(Colours.Warning);
        if (refreshMessage === false) embed.setFooter({text: ">>> Changing the channel or rule will reset your custom message. <<<"});
        await interaction.editReply({ embeds: [embed], components: [ruleSelectMenu, channelSelectMenu, buttons]});

        const i = await dualCollector(
            interaction,
            (i) => i.message.id === m.id,
        );

        if (!i) {
            break;
        }
        if (i.isButton() && i.customId === "sendButton") {
            await i.deferUpdate();
            readyToSend = true;
            breakOut = true;
        } else if (i.isButton() && i.customId === "modifyText") {
            await showTextModal(message, i);
        } else if (i.isModalSubmit()) {
            await i.deferUpdate();
            message = i.fields.getField("newMessage")?.value;
            refreshMessage = false;
        } else if (i.isStringSelectMenu()) {
            await i.deferUpdate();
            chosenRule = parseInt(i.values[0]!);
            refreshMessage = true;
        } else if (i.isChannelSelectMenu()) {
            await i.deferUpdate();
            suggestedChannel = i.values[0]!;
            refreshMessage = true;
        } else {
            await i.deferUpdate();
            break;
        }

    }
    if (readyToSend) {
        await reportContent(
            interaction.targetMessage,
            chosenRule,
            suggestedChannel,
            ruleList,
            false,
            message
        );
        await interaction.deleteReply();
    } else {
        await interaction.editReply({embeds: [new EmbedBuilder()
            .setTitle("Report Content")
            .setDescription("No action was taken - Operation cancelled")
            .setColor(Colours.Warning)
        ], components: []});
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await interaction.deleteReply();
    }
};

const showTextModal = async (oldText: string, interaction: ButtonInteraction) => {
    await interaction.showModal(new ModalBuilder()
        .setCustomId("textModal")
        .setTitle("Modify Message")
        .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
            .setCustomId("newMessage")
            .setLabel("Modify the message")
            .setMaxLength(4000)
            .setStyle(TextInputStyle.Paragraph)
            .setValue(oldText)
        ))
    );
};


const generateMessage = (
    memberId: string,
    chosenRule: number | undefined,
    suggestedChannel: string | undefined,
    ruleList: string[],
    automated: boolean
) => {
    const preamble = `Hey there <@${memberId}>!\n` +
        "Your post was removed for not following this channel's guidelines.";
    const ruleBroken = chosenRule !== undefined ? (
        `Your post was flagged for breaking Rule ${chosenRule + 1}: ${ruleList[chosenRule]}.`
    ) : "";
    const suggestedChannelText = suggestedChannel ? `This content would fit in better in <#${suggestedChannel}>.` : "";
    const automatedText = automated ? "*This action was done automatically - Please contact a moderator if this was a mistake.*" : "";
    const text = [preamble, ruleBroken, suggestedChannelText, automatedText].filter((x) => x !== "").join("\n");

    return text;
};

const reportContent = async (
    message: Message,
    chosenRule: number | undefined,
    suggestedChannel: string | undefined,
    ruleList: string[] = generateRuleList(message.channel!.id),
    automated: boolean = false,
    text?: string
) => {
    const embedText = text || generateMessage(message.author.id, chosenRule, suggestedChannel, ruleList, automated);
    const components: ActionRowBuilder<ButtonBuilder>[] = [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("global:rules")
            .setLabel("View rules")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(`global:hide?@${message.author.id}`)
            .setLabel("Hide this message")
            .setStyle(ButtonStyle.Secondary)
    )];

    await message.channel?.send({ content: embedText, components });
    await message.delete();
};

const generateRuleList = (channel: string): string[] => {
    const channelId = channel as keyof typeof contentRestrictions.reports;
    const restrictions = contentRestrictions.reports[channelId] as { guidelines?: string, rules: string[], enforceSpoilers?: boolean};
    const ruleList = restrictions.rules.map(x => x);
    if (restrictions.guidelines) ruleList.push(guidelines(restrictions.guidelines));
    if (restrictions.enforceSpoilers) ruleList.unshift(contentRestrictions.messages.spoiler);
    return ruleList;
};

const rulesInChannel = async (interaction: ButtonInteraction) => {
    // This triggers when someone presses the "View rules" button (global:rules)
    const ruleList = generateRuleList(interaction.channel!.id);

    await interaction.reply({ embeds: [new EmbedBuilder()
        .setTitle("Rules in this channel")
        .setDescription(ruleList.map((rule, index) => `${index + 1}. ${rule}`).join("\n"))
        .setColor(Colours.Warning)
    ], ephemeral: true });
};

const hideMessage = async (interaction: ButtonInteraction) => {
    // The customID is something like "global:hide!@1234567890"
    const customIdParameters = interaction.customId.split("?");
    const expected = `@${interaction.user.id}`;
    if (customIdParameters[1] !== expected) {
        await interaction.reply({
            content: `This message is not for you - Only <${customIdParameters[1]}> can hide this message.`,
            ephemeral: true
        });
        return;
    }
    await interaction.deferUpdate();
    await interaction.message.delete();

};

export { command, callback, rulesInChannel, reportContent, hideMessage };
