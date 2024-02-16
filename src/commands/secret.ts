import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder } from "@discordjs/builders";
import { ButtonInteraction, ButtonStyle, CommandInteraction, GuildTextBasedChannel, ModalSubmitInteraction, TextInputStyle } from "discord.js";
import { Colours, rules } from "../data";
import { logSecret } from "../actions/secrets";


const secret = new SlashCommandBuilder()
    .setName("secret")
    .setDescription("Tell a secret to the server")
    .addStringOption(option => option.setName("secret").setDescription("The secret to tell").setRequired(true).setMaxLength(1000));


const standardRules = "✅ Keep it fun and sexy\n" +
        "❌ No references to self-harm, violence, or non-consensual activities\n" +
        "👍 Follow server guidelines";

const channels: Record<string, {embedTitle: string, postType: string, rules?: string, moveButton?: boolean}> = {
    [rules.channels.secrets]: {embedTitle: "Secret", postType: "secret", rules: standardRules, moveButton: true},
    [rules.channels.confessions]: {embedTitle: "Confession", postType: "confession", rules: standardRules},
    [rules.channels.talkItOut]: {embedTitle: "Talk it Out", postType: "thoughts"}
};


const callback = async (interaction: CommandInteraction | ButtonInteraction) => {
    const { i, secret } = await interactionReply(interaction) || {i: undefined};
    if (!i || !secret) return;

    let channelId = interaction.channelId;
    if (interaction.channel?.isThread()) channelId = interaction.channel.parentId!;

    if (!Object.keys(channels).includes(channelId)) {
        return await i.reply({embeds: [
            new EmbedBuilder()
                .setTitle("Wrong Channel")
                .setDescription(`Please use this command in <#${rules.channels.secrets}> or <#${rules.channels.confessions}>.`)
                .setColor(Colours.Danger)
        ], ephemeral: true});
    }

    const channelData = channels[channelId]!;

    const agreed = await agreedToSecret(i, channelData.embedTitle, channelData?.postType, secret, channelData?.rules);
    if (agreed === undefined) return;
    if (!agreed) return await i.deleteReply();

    const channel = interaction.channel as GuildTextBasedChannel;
    const message = await channel.send(`*Anonymous said*: "${secret}"`);
    void logSecret(channel.id, message.id, interaction.user.id);
    await i.deleteReply();

    if (!channelData.moveButton) return;

    // Purge any messages from the bot with components
    const messages = await interaction.channel!.messages.fetch({ limit: 10 });
    await channel.bulkDelete(messages.filter(m => m.author.id === interaction.client.user!.id && m.components.length > 0));
    // Then send a new message with a button
    await interaction.channel!.send({ components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("global:secret").setLabel("Share a Secret").setStyle(ButtonStyle.Danger)
    )] });
};

const interactionReply = async (interaction: CommandInteraction | ButtonInteraction) => {
    // If they used a slash command, just use the data from it
    if (interaction.isCommand()) return { i: interaction, secret: interaction.options.get("secret")!.value as string };
    // Otherwise, ask in a modal
    await interaction.showModal(new ModalBuilder()
        .setCustomId("text")
        .setTitle("Share a Secret")
        .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
            .setCustomId("secret")
            .setLabel("Share a secret")
            .setMaxLength(2000)
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder("Pressing submit will NOT send a message")
        ))
    );
    // Define an interaction
    let i = undefined as undefined | ModalSubmitInteraction;
    try {
        i = await interaction.awaitModalSubmit({ filter: (i) =>
            i.user.id === interaction.user.id,  // Do a message check here
        time: 60000 }) as typeof i;
    } catch (e) {
        return;
    }
    if (!i) return;
    return {i, secret: i.components[0]?.components[0]?.value};
};

const agreedToSecret = async (
    interaction: CommandInteraction | ModalSubmitInteraction,
    title: string,
    postType: string,
    secret: string,
    rules?: string
): Promise<boolean | undefined> => {
    const messageData = { embeds: [new EmbedBuilder()
        .setTitle(title)
        .setDescription(
            `**Preview:**\n> ${secret}` +
            (rules ? "\n\n**Rules:**\n" + rules : "" )+
            `\n\n**Warning:**\nYou will not be able to edit or delete this ${postType} once it is sent. (Only moderators can delete it.)` +
            "\n\nIf you understand this and still want to send it, click the button below."
        )
        .setColor(Colours.Warning)
    ], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("agree").setLabel("Agree and Send").setStyle(ButtonStyle.Danger)
    )]};
    // Send to the channel
    const m = await interaction.reply({...messageData, fetchReply: true, ephemeral: true});
    // Wait for the user to press a button
    let button;
    try {
        button = await m.awaitMessageComponent({ filter: (i) =>
            i.user.id === interaction.user.id && i.message.id === m.id,
        time: 60000 }) as ButtonInteraction;
    } catch (e) { return; }
    await button.deferUpdate();
    // If they agreed, return true, otherwise return false
    // Undefined is used as a null response
    return button.customId === "agree";
};

export {
    secret as command,
    callback
};

