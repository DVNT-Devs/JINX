import { ButtonInteraction, ButtonStyle, ChannelSelectMenuInteraction, ChannelType, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
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
    const channelId = channel.id as keyof typeof contentRestrictions.reports;
    const restrictions = contentRestrictions.reports[channelId] as { guidelines?: string, rules: string[] };
    const ruleList = restrictions.rules.map(x => x);
    if (restrictions.guidelines) ruleList.push(guidelines(restrictions.guidelines));

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
            chosenRule = parseInt(i.values[0]!);
        } else if (i.isChannelSelectMenu()) {
            suggestedChannel = i.values[0]!;
        }
    }
    if (readyToSend) {
        const preamble = `Hey there <@${interaction.targetMessage.author.id}>!\n` +
            "Your post was removed for not following this channel's guidelines.";
        const ruleBroken = chosenRule ? (
            `Your post was marked for breaking rule ${chosenRule + 1}: ${ruleList[chosenRule]}.`
        ) : "";
        const suggestedChannelText = suggestedChannel ? `This content would fit in better in <#${suggestedChannel}>.` : "";
        const embedText = [preamble, ruleBroken, suggestedChannelText].filter((x) => x !== "").join("\n");
        const components: ActionRowBuilder<ButtonBuilder>[] = [new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("global:rules")
                .setLabel("View rules")
                .setStyle(ButtonStyle.Danger)
        )];

        await interaction.channel?.send({ content: embedText, components });
        await interaction.deleteReply();
        await interaction.targetMessage.delete();
    } else {
        await interaction.editReply({embeds: [new EmbedBuilder()
            .setTitle("Report Content")
            .setDescription("No action was taken - Operation cancelled")
            .setColor(Colours.Warning)
        ], components: []});
    }
};

const rulesInChannel = async (interaction: ButtonInteraction) => {
    // This triggers when someone presses the "View rules" button (global:rules)
    const channelId = interaction.channel!.id as keyof typeof contentRestrictions.reports;
    const restrictions = contentRestrictions.reports[channelId] as { guidelines?: string, rules: string[] };
    const ruleList = restrictions.rules.map(x => x);
    if (restrictions.guidelines) ruleList.push(guidelines(restrictions.guidelines));

    await interaction.reply({ embeds: [new EmbedBuilder()
        .setTitle("Rules in this channel")
        .setDescription(ruleList.map((rule, index) => `${index + 1}. ${rule}`).join("\n"))
        .setColor(Colours.Warning)
    ], ephemeral: true });
};

export { command, callback, rulesInChannel };
