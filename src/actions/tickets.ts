import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { APIMessageComponentEmoji, BaseGuildTextChannel, ButtonInteraction, ButtonStyle, ChannelType, CommandInteraction, Guild, GuildChannel, GuildMember, PrivateThreadChannel, TextInputStyle, ThreadAutoArchiveDuration, User, parseEmoji } from "discord.js";
import { Colours } from "../utils/data";
import { plural } from "../commands/discipline";


const ticketTypes: Record<string, {
    type: string,
    start: string,
    createNotify: string,
    icon: string,
    limit: number,
    standardTimeout: ThreadAutoArchiveDuration,
    text: string
}> =  {
    "1164256806495850556": {
        type: "Age Verification",
        start: "verify",
        createNotify: "1164694356314304624",
        icon: "🔞",
        limit: 1,
        standardTimeout: ThreadAutoArchiveDuration.OneHour,
        text: "To verify your age, we require both:\n" +
            "1. A selfie of you holding a piece of paper which states your full username and the server name. " +
            "Your face must be clearly visible, no filters used and the picture must be good quality.\n" +
            "2. A clear picture of your photo ID (you can cover everything, but your picture and date of birth must be visible).\n" +
            "Acceptable forms of ID include Driver's License, State ID, or Passport\n\n" +
            "Please send the photos in this ticket when you are ready. Support will be with you shortly.\n\n" +
            "You may close your ticket, however this will cancel the verification process."
    },
    "1161826563843690497": {
        type: "Report",
        start: "report",
        createNotify: "1216087276291887224",
        icon: "🚨",
        limit: 3,
        standardTimeout: ThreadAutoArchiveDuration.OneWeek,
        text: "Thanks for helping us to keep DVNT fun and safe!\nPlease describe your issue, and a moderator will be with you shortly."
    }
};
const closeLogs = "1164696678633308300";


const createTicket = async (interaction?: ButtonInteraction, channel?: GuildChannel, member?: GuildMember) => {
    if (interaction?.deferred) await interaction?.deferUpdate();
    if (interaction) {
        // Check for if it ends with :verify or :report
        for (const type of Object.keys(ticketTypes)) {
            if (interaction.customId.endsWith(`:${ticketTypes[type]!.start}`)) {
                channel = interaction.guild!.channels.resolve(type) as GuildChannel;
                member = interaction.member as GuildMember;
                break;
            }
        }
        if (Object.keys(ticketTypes).includes(interaction.channelId) && !(channel && member)) {
            channel = interaction.channel as GuildChannel;
            member = interaction.member as GuildMember;
        }
    }

    channel = channel || interaction!.channel as GuildChannel;
    member = member || interaction!.member as GuildMember;
    const shortID = member.id;  // In the future, we can use a shortID library to generate a unique ID (Must be 2 way)

    const type = ticketTypes[channel.id] || null;
    if (!type) return;
    if (!channel.isTextBased()) return;
    const currentTickets = (channel as BaseGuildTextChannel).threads.cache
        .filter(t => t.parentId === channel!.id)
        .filter(t => !t.locked)
        .filter(t => t.name.startsWith(type.start) && t.name.includes(shortID));

    if (currentTickets.size >= type.limit) return await interaction?.reply({embeds: [new EmbedBuilder()
        .setTitle("Limit Reached")
        .setDescription(
            `You have reached the limit of ${type.type} tickets. You may only have ${plural(type.limit, `${type.type} ticket`)} open at once.\n` +
            `**Active ticket${type.limit === 1 ? "" : "s"}:** ${currentTickets.map(t => `<#${t.id}>`).join(", ")}\n\n`
        )
        .setColor(Colours.Danger)
    ], ephemeral: true});
    // The user could have closed a thread, so the names end in 1 and 3. This finds the first missing number
    const firstNumberMissing = Array.from({length: type.limit}, (_, i) => i + 1)[currentTickets.size];

    const textChannel = channel as BaseGuildTextChannel;
    const thread = await textChannel.threads.create({
        name: `${type.start}-${member.user.username}-${shortID}t${firstNumberMissing}`,
        autoArchiveDuration: type.standardTimeout,
        type: ChannelType.PrivateThread
    });
    await thread.join();
    await thread.members.add(member.id);

    const notifyChannel = member.guild.channels.resolve(type.createNotify) as BaseGuildTextChannel;

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const createdMessage = await notifyChannel.send({embeds: [new EmbedBuilder()
        .setTitle(`${type.icon} Ticket Created`)
        .setDescription(
            `**Opened by:** <@${member.id}>\n` +
            `**Type:** ${type.type}\n` +
            `**Created:** <t:${currentTimestamp}:R> (<t:${currentTimestamp}:f>)`
        )
        .setColor(Colours.Success)
    ], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("View Ticket")
            .setURL(`https://discord.com/channels/${member.guild.id}/${thread.id}`),
        new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setLabel("Join Thread")
            .setCustomId(`global:ticket.join:${thread.id}`)
    )]});

    const intro = await thread.send({embeds: [
        new EmbedBuilder()
            .setTitle(type.type)
            .setDescription(type.text)
            .setColor(Colours.Success),
        new EmbedBuilder()
            .setTitle("Internal Details")
            .setDescription(
                "*This embed is just here for use by Jinx. Please don't unpin it*\n" +
                `${createdMessage.channelId}/${createdMessage.id}\n` +
                `${member.id}`
            )

    ], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setEmoji(parseEmoji("🔒") as APIMessageComponentEmoji)
            .setLabel("Close Ticket")
            .setCustomId("global:ticket.close"),
        new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setEmoji(parseEmoji("🔒") as APIMessageComponentEmoji)
            .setLabel("Close Ticket with Reason")
            .setCustomId("global:ticket.close:reason")
    )]});
    await intro.pin();

    if (interaction) await interaction.reply({embeds: [new EmbedBuilder()
        .setTitle("Ticket Created")
        .setDescription(`Your ticket has been created in <#${thread.id}>`)
        .setColor(Colours.Success)
    ], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("Open Ticket")
            .setURL(`https://discord.com/channels/${member.guild.id}/${thread.id}`)
    )], ephemeral: true});
};


const canCloseTicket = (_member: GuildMember) => {
    // In the future, we can add more logic here to check if the member has the right permissions to close the ticket
    return true;
};

const closeTicket = async (interaction: ButtonInteraction | CommandInteraction, reason?: string) => {
    if (!interaction.deferred && !interaction.replied && interaction.isButton()) await interaction.deferUpdate();
    if (!interaction.channel?.isThread()) return;
    const channel = interaction.channel as PrivateThreadChannel;
    // Check if the parent channel is a ticket channel
    if (!channel.parent) return;
    if (!Object.keys(ticketTypes).includes(channel.parentId!)) return;
    // The user ID is the penultimate of the thread name
    const threadTarget = channel.name.split("-").pop()?.split("t")[0];
    if (threadTarget) await channel.members.remove(threadTarget);

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const embed = new EmbedBuilder()
        .setTitle("Ticket Closed")
        .setDescription(`This ticket has been closed by <@${interaction.user.id}> at <t:${currentTimestamp}:R> (<t:${currentTimestamp}:f>)`)
        .setColor(Colours.Danger);
    if (interaction.isButton()) { await interaction.message?.edit({embeds: [embed, interaction.message.embeds[1]!]});
    } else  { await interaction.reply({embeds: [embed]});
    }

    await channel.setLocked(true).then(() => channel.setArchived(true));

    const type = ticketTypes[channel.parentId!] || null;

    const notifyChannel = interaction.guild!.channels.resolve(closeLogs) as BaseGuildTextChannel;
    await notifyChannel.send({embeds: [new EmbedBuilder()
        .setTitle("Ticket Closed")
        .setDescription(
            `**Closed by:** <@${interaction.user.id}>\n` +
            `**Ticket for:** <@${threadTarget}>\n` +
            `**Type:** ${type?.icon} ${type?.type}\n` +
            `**Reason:** ${reason || "*No reason provided*"}\n` +
            `**Closed:** <t:${currentTimestamp}:R> (<t:${currentTimestamp}:f>)`
        )
        .setColor(Colours.Danger)
        .setFooter({text: `Ticket ID: ${channel.id} | Messages in ticket: ${channel.messageCount}`})
    ], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("View Ticket")
        .setURL(`https://discord.com/channels/${interaction.guild!.id}/${channel.id}`)
    )]});

    // Fetch the oldest channel pin
    const pins = await channel.messages.fetchPinned();
    const data = pins.first()?.embeds[1]?.description || null;
    if (!data) return;
    const [_preamble, threadInfo, _userInfo, ..._rest] = data.split("\n");
    const [channelId, messageId] = threadInfo!.split("/");
    if (!channelId || !messageId) return;
    const targetChannel = await interaction.guild!.channels.resolve(channelId) as BaseGuildTextChannel;
    if (!channel) return;
    const targetMessage = await targetChannel.messages.fetch(messageId);
    if (!targetMessage) return;
    await targetMessage.delete();
};

const closeWithReason = async (interaction: ButtonInteraction) => {
    if (! (await canCloseTicket(interaction.member as GuildMember))) return;
    await interaction.showModal(new ModalBuilder()
        .setTitle("Close ticket")
        .setCustomId("close_modal")
        .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
                .setCustomId("reason")
                .setPlaceholder("Reason for closing the ticket")
                .setLabel("Reason")
                .setMinLength(1)
                .setMaxLength(1000)
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
        ))
    );
    // Wait for the user to enter a reason
    // If they don't, it can just be ignored
    const i = await interaction.awaitModalSubmit({
        filter: (i) => i.customId === "close_modal" && i.user.id === interaction.user.id,
        time: 60000
    }).catch(() => null);
    if (!i) return;
    await i.deferUpdate();
    const reason = i.fields.fields.get("reason")?.value;
    await closeTicket(interaction, reason);
};

const joinThread = async (interaction: ButtonInteraction) => {
    // global:ticket.join:threadId
    const threadId = interaction.customId.split(":")[2];
    const member = interaction.member as GuildMember;

    const channels = member.guild.channels.cache
        .filter(c => c.isThread())
        .filter(c => c.type === ChannelType.PrivateThread)
        .filter(c => c.id === threadId);
    if (channels.size === 0) return;
    const thread = channels.first() as PrivateThreadChannel;
    await thread.members.add(member.id);

    await interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle("Joined Ticket")
            .setDescription(`You have joined the ticket in <#${thread.id}>`)
            .setColor(Colours.Success)
        ],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Open Ticket")
                .setURL(`https://discord.com/channels/${member.guild.id}/${thread.id}`)
        )],
        ephemeral: true
    });
};

const handleThreadClose = async (interaction: CommandInteraction, reason?: string) => {
    const channel = interaction.channel as PrivateThreadChannel;
    if (!channel) return;
    if (!channel.parent) return;
    if (!Object.keys(ticketTypes).includes(channel.parentId!)) return await interaction.reply({embeds: [new EmbedBuilder()
        .setTitle("Error")
        .setDescription("This command can only be used in a ticket")
        .setColor(Colours.Danger)
    ]});
    await closeTicket(interaction, reason);
};

const deleteAllThreads = async (guild: Guild, user: User) => {
    const threads = guild.channels.cache
        .filter(c => c.isThread())
        .filter(c => c.type === ChannelType.PrivateThread)
        .filter(c => c.name.includes(user.id));
    for (const thread of threads.values()) {
        await closeTicket({channel: thread as PrivateThreadChannel} as ButtonInteraction);
    }
};

export { createTicket, closeTicket, closeWithReason, joinThread, handleThreadClose, deleteAllThreads };
