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
        );

        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setTitle("Report Content")
            .setDescription(
                `You have selected [this message](${interaction.targetMessage.url}) by <@${interaction.targetMessage.author.id}>.\n` +
                "You can select a rule this message  breaks, and optionally suggest a channel to move it to.\n" +
                `Current rule selected: ${chosenRule ? ruleList[chosenRule] : "*None*"}\n` +
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
        const ruleBroken = chosenRule ? (ruleList.map((rule, index) => {
            return `${index + 1}. ${rule}`;
        }).join("\n") + `\n\nIn particular, this content breaks rule ${chosenRule + 1}`) : "";
        const suggestedChannelText = suggestedChannel ? `This content would fit in better in <#${suggestedChannel}>.` : "";
        const embedText = [ruleBroken, suggestedChannelText].filter((x) => x !== "").join("\n\n");
        let components: ActionRowBuilder<ButtonBuilder>[] = [];
        if (!ruleBroken) components = [new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
                .setCustomId("global:rules")
                .setLabel("View rules")
                .setStyle(ButtonStyle.Danger)
        ])];
        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setTitle("Report Content")
            .setDescription(
                "This is a development command - No action was taken.\n" +
                "The user would have seen this:\n\n" + embedText
            )
            .setColor(Colours.Success)
        ], components});
    } else {
        await interaction.editReply({embeds: [new EmbedBuilder()
            .setTitle("Report Content")
            .setDescription("No action was taken - Operation cancelled")
            .setColor(Colours.Warning)
        ], components: []});
    }
};

export { command, callback };
