import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder } from "@discordjs/builders";
import { ButtonInteraction, ButtonStyle, CommandInteraction, GuildTextBasedChannel, ModalSubmitInteraction, TextInputStyle } from "discord.js";
import { Colours, rules } from "../data";
import { logSecret } from "../actions/secrets";


const praise = new SlashCommandBuilder()
    .setName("secret")
    .setDescription("Tell a secret to the server")
    .addStringOption(option => option.setName("secret").setDescription("The secret to tell").setRequired(true).setMaxLength(1000));


const callback = async (interaction: CommandInteraction | ButtonInteraction) => {
    let secret;
    let i;
    if (interaction.isButton()) {
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
        i = undefined as undefined | ModalSubmitInteraction;
        try {
            i = await interaction.awaitModalSubmit({
                filter: (i) => i.user.id === interaction.user.id,
                time: 60000 * 5
            }) as typeof i;
        } catch (e) {
            return;
        }
        if (!i) return;
        secret = i.components[0]?.components[0]?.value;
    } else {
        secret = interaction.options.get("secret")!.value as string;
        i = interaction;
    }
    const inSecretsChannel = interaction.channelId === rules.channels.secrets;
    console.log(interaction.channelId, inSecretsChannel, rules.channels.secrets);
    const inConfessionsCategory = interaction.channel?.isThread() && interaction.channel.parentId === rules.channels.confessions;
    if (!inSecretsChannel && !inConfessionsCategory) {
        await i.reply({ embeds: [new EmbedBuilder()
            .setTitle("Wrong Channel")
            .setDescription(`Please use this command in <#${rules.channels.secrets}> or <#${rules.channels.confessions}>.`)
            .setColor(Colours.Danger)
        ], ephemeral: true});
        return;
    }
    const prompt = inSecretsChannel ? "Secret" : "Confession";
    const messageData = { embeds: [new EmbedBuilder()
        .setTitle(prompt)
        .setDescription(
            `**Preview:**\n> ${secret}\n\n` +
            "**Rules:**\n" +
            "✅ Keep it fun and sexy\n" +
            "❌ No references to self-harm, violence, or non-consensual activities\n" +
            "👍 Follow server guidelines\n" +
            `\n**Warning:**\nYou will not be able to edit or delete this ${prompt.toLowerCase()} once it is sent. (Only moderators can delete it.)` +
            "\n\nIf you understand this and still want to send it, click the button below."
        )
        .setColor(Colours.Warning)
    ], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("agree").setLabel("Agree and Send").setStyle(ButtonStyle.Danger)
    )]};
    const m = await i.reply({...messageData, fetchReply: true, ephemeral: true});
    let button;
    try {
        button = await m.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id && m.id === i.message.id,
            time: 60000 * 5
        }) as ButtonInteraction;
    } catch (e) {
        return;
    }
    if (!i) return;
    void button.deferUpdate();
    if (button.customId !== "agree") return;

    const channel = interaction.channel as GuildTextBasedChannel;
    const message = await channel.send(`*Anonymous said*: "${secret}"`);
    void logSecret(channel.id, message.id, interaction.user.id);
    await i.deleteReply();

    if (inConfessionsCategory) return;

    // Purge any messages from the bot with components
    const messages = await interaction.channel!.messages.fetch({ limit: 10 });
    const bulkDeleteChannel = interaction.channel! as GuildTextBasedChannel;
    await bulkDeleteChannel.bulkDelete(messages.filter(m => m.author.id === interaction.client.user!.id && m.components.length > 0));
    // Then send a new message with a button
    await interaction.channel!.send({ components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("global:secret").setLabel("Share a Secret").setStyle(ButtonStyle.Danger)
    )] });
};


export {
    praise as command,
    callback
};
