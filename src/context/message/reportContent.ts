import { ButtonInteraction, ButtonStyle, ChannelSelectMenuInteraction, ChannelType, ContextMenuCommandBuilder, Message, MessageContextMenuCommandInteraction, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { contentRestrictions, Colours } from "../../data";
import { ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders";

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

    while (!breakOut) {
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
                .setDisabled((chosenRule === undefined) && !(suggestedChannel))
        );

        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setTitle("Report Content")
            .setDescription(
                `You have selected [this message](${interaction.targetMessage.url}) by <@${interaction.targetMessage.author.id}>.\n` +
                "You can select a rule this message breaks, and optionally suggest a channel to move it to.\n" +
                `Current rule selected: ${chosenRule !== undefined ? ruleList[chosenRule] : "*None*"}\n` +
                `Current suggested channel: ${suggestedChannel ? `<#${suggestedChannel}>` : "*None*"}`
            )
            .setColor(Colours.Warning)
        ], components: [ruleSelectMenu, channelSelectMenu, buttons]});

        let i: StringSelectMenuInteraction | ChannelSelectMenuInteraction | ButtonInteraction;
        try {
            i = await m.awaitMessageComponent({ filter: (i) =>
                i.user.id === interaction.user.id && m.id === i.message.id,
            time: 60000 }) as typeof i;
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
            chosenRule = parseInt(i.values[0]!);
        } else if (i.isChannelSelectMenu()) {
            suggestedChannel = i.values[0]!;
        }
    }
    if (readyToSend) {
        await reportContent(interaction.targetMessage, chosenRule, suggestedChannel);
        await interaction.deleteReply();
    } else {
        await interaction.editReply({embeds: [new EmbedBuilder()
            .setTitle("Report Content")
            .setDescription("No action was taken - Operation cancelled")
            .setColor(Colours.Warning)
        ], components: []});
    }
};

const reportContent = async (
    message: Message,
    chosenRule: number | undefined,
    suggestedChannel: string | undefined,
    ruleList: string[] = generateRuleList(message.channel!.id),
    automated: boolean = false
) => {
    const preamble = `Hey there <@${message.author.id}>!\n` +
        "Your post was removed for not following this channel's guidelines.";
    const ruleBroken = chosenRule !== undefined ? (
        `Your post was flagged for breaking Rule ${chosenRule + 1}: ${ruleList[chosenRule]}.`
    ) : "";
    const suggestedChannelText = suggestedChannel ? `This content would fit in better in <#${suggestedChannel}>.` : "";
    const automatedText = automated ? "*This action was done automatically - Please contact a moderator if this was a mistake.*" : "";
    const embedText = [preamble, ruleBroken, suggestedChannelText, automatedText].filter((x) => x !== "").join("\n");
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
