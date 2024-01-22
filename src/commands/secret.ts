import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { APIMessageComponentEmoji, ButtonInteraction, ButtonStyle, CommandInteraction, GuildTextBasedChannel } from "discord.js";
import { Colours, rules } from "../data";
import { logSecret } from "../actions/secrets";


const praise = new SlashCommandBuilder()
    .setName("secret")
    .setDescription("Tell a secret to the server")
    .addStringOption(option => option.setName("secret").setDescription("The secret to tell").setRequired(true).setMaxLength(1000));


const tickEmoji = "947441964234702849";

const callback = async (interaction: CommandInteraction) => {
    const secret = interaction.options.get("secret")!.value as string;
    if (interaction.channelId !== rules.channels.secrets) {
        await interaction.reply({ embeds: [new EmbedBuilder()
            .setTitle("Wrong Channel")
            .setDescription(`Please use this command in <#${rules.channels.secrets}>. It shouldn't even be possible to do this...`)
            .setColor(Colours.Danger)
        ], ephemeral: true});
        return;
    }
    const m = await interaction.reply({ embeds: [new EmbedBuilder()
        .setTitle("Secret")
        .setDescription(
            `**Preview:**\n> ${secret}\n\n` +
            "**Rules:**\n" +
            "✅ Keep it fun and sexy\n" +
            "❌ No references to self-harm, violence, or non-consensual activities\n" +
            "👍 Follow server guidelines\n" +
            "\n**Warning:**\nYou will not be able to edit or delete this secret once it is sent. (Only moderators can delete secrets.)" +
            "\n\nIf you understand this and still want to send it, click the button below."
        )
        .setColor(Colours.Warning)
    ], ephemeral: true, fetchReply: true, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("agree").setLabel("Agree and Send").setStyle(ButtonStyle.Danger)
    )]});
    let i: ButtonInteraction;
    try {
        i = await m.awaitMessageComponent({ filter: (i) =>
            i.user.id === interaction.user.id && m.id === i.message.id,
        time: 60000 }) as typeof i;
    } catch (e) {
        return;
    }
    i.deferUpdate();
    if (i.customId !== "agree") return;

    const channel = interaction.guild!.channels.cache.get(rules.channels.secrets)! as GuildTextBasedChannel;
    const message = await channel.send(`*Anonymous said*: "${secret}"`);
    logSecret(channel.id, message.id, interaction.user.id);
    await interaction.editReply({ embeds: [new EmbedBuilder()
        .setTitle("Secret Sent")
        .setDescription(`Your secret has been sent to the server. [Click here to view it.](${message.url})`)
        .setColor(Colours.Success)
    ], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder()
        .setCustomId("disabled")
        .setDisabled(true)
        .setLabel("Agree and Send")
        .setStyle(ButtonStyle.Success)
        .setEmoji({ id: tickEmoji, name: "tick" } as APIMessageComponentEmoji)
    )]});
};


export {
    praise as command,
    callback
};
