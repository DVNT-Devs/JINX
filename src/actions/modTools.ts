import { APIMessageComponentEmoji, ButtonInteraction, ButtonStyle, ChannelType, GuildMemberRoleManager, ModalSubmitInteraction, PermissionFlagsBits, PermissionsBitField, TextInputStyle, UserContextMenuCommandInteraction, parseEmoji } from "discord.js";
import DB from "../database/drizzle";
import { flags, timeouts } from "../database/schema";
import { and, eq } from "drizzle-orm";
import { ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, EmbedBuilder, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder } from "@discordjs/builders";
import data, { Colours } from "../utils/data";
import dualCollector, { BuilderType } from "../utils/dualCollector";
import client from "../client";

const flagBits: {name: string, description: string, emoji: string}[] = [
    {name: "Creepy Behavior", description: "The user is exhibiting creepy behavior", emoji: "👀"},
    {name: "Unwanted DMs", description: "The user is sending unwanted DMs", emoji: "📩"},
    {name: "Spam", description: "The user is spamming", emoji: "🚫"},
    {name: "Wrong Channels", description: "The user is posting in the wrong channels", emoji: "🔇"},
    {name: "Watchlist", description: "The user is on the watchlist", emoji: "🕵️"}
];

const integerToBooleanArray = (num: number) => {
    const arr = num.toString(2).split("").reverse();
    // Always return an array of the same length as bitFlags
    const sameLength = arr.map((bit) => bit === "1").concat(new Array(flagBits.length - arr.length).fill(false));
    return sameLength;
};
const indexArrayToInteger = (arr: number[]) => {
    let out = 0;
    for (const i of arr) { out |= 1 << i; }
    return out;
};


const frequencies: { name: string, description: string, interval: number }[] = [
    { name: "No limit",       description: "Remove restrictions", interval: 0 },
    { name: "Every hour",     description: "24 posts per day",    interval: 60 * 60 },
    { name: "Every 3 hours",  description: "8 posts per day",     interval: 60 * 60 * 3 },
    { name: "Every 6 hours",  description: "4 posts per day",     interval: 60 * 60 * 6 },
    { name: "Every 12 hours", description: "2 posts per day",     interval: 60 * 60 * 12 },
    { name: "Every day",      description: "1 post per day",      interval: 60 * 60 * 24 },
    { name: "Every 2 days",   description: "3-4 posts per week",  interval: 60 * 60 * 24 * 2 },
    { name: "Every week",     description: "4 posts per month",   interval: 60 * 60 * 24 * 7 },
    { name: "Every 2 weeks",  description: "2 posts per month",   interval: 60 * 60 * 24 * 14 },
    { name: "Every month",    description: "1 post per month",    interval: 60 * 60 * 24 * 30 }
];


const userContextCallback = async (interaction: UserContextMenuCommandInteraction) => {
    await interaction.deferReply({ ephemeral: true });
    const db = await DB;
    const breakOut = false;
    const defaultData = {
        member: interaction.targetUser.id,
        flags: 0,
        note: ""
    };

    // Fetch the user's data from the database
    const dbData = await db.select().from(flags).where(eq(flags.member, interaction.targetUser.id));
    const timeoutResults = await db.select().from(timeouts).where(eq(timeouts.member, interaction.targetUser.id));
    let timeoutResultsMap: Record<string, number> = {};
    for (const timeout of timeoutResults) {
        timeoutResultsMap[timeout.channel] = timeout.frequency;
    }
    let targetChannel = interaction.channel!.id;
    let showTimeouts = false;

    let userData;
    let dbEntry: boolean = dbData.length > 0;
    do {
        const isAgeVerified = (interaction.targetMember?.roles as GuildMemberRoleManager) .cache.has(data.roles.ageVerified);
        userData = userData || dbData[0] || defaultData;
        const flagArray = integerToBooleanArray(userData.flags);
        let updateDB = false;

        const flagSelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder()
            .setCustomId("flagSelect")
            .setPlaceholder("Select a flag")
            .setMaxValues(flagBits.length)
            .setMinValues(0)
            .addOptions(flagBits.map((flag, index) => new StringSelectMenuOptionBuilder()
                .setLabel(flag.name)
                .setDescription(flag.description)
                .setEmoji(parseEmoji(flag.emoji) as APIMessageComponentEmoji)
                .setValue(index.toString())
                .setDefault(flagArray[index])
            ))
        );
        const TextTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement,
            ChannelType.PublicThread, ChannelType.PrivateThread];
        const isThread = interaction.guild?.channels.cache.get(targetChannel)?.isThread();
        const timeoutSelect = [
            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(new ChannelSelectMenuBuilder()
                .setCustomId("channelSelect")
                .setMaxValues(1)
                .setMinValues(1)
                .setDefaultChannels(isThread ? [] : [targetChannel])  // FIXME: Discord is giving 500's here when thread
                .setPlaceholder("Select a channel")
                .setChannelTypes(TextTypes)
            ),
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder()
                .setCustomId("timeoutSelect")
                .setPlaceholder("Select a timeout")
                .setMaxValues(1)
                .setMinValues(1)
                .addOptions(frequencies.map((freq) => new StringSelectMenuOptionBuilder()
                    .setLabel(freq.name)
                    .setDescription(freq.description)
                    .setValue(freq.interval.toString())
                    .setDefault((timeoutResultsMap[targetChannel] || 0) === freq.interval)
                ))
            )
        ];

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("note")
                .setLabel(userData.note ? "Edit Note" : "Add Note")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("showTimeouts")
                .setLabel(showTimeouts ? "Show Flags" : "Show Timeouts")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("ageVerify")
                .setLabel(isAgeVerified ? "Age Verified" : "Verify Age")
                .setStyle(isAgeVerified ? ButtonStyle.Secondary : ButtonStyle.Success)
                .setDisabled(
                    isAgeVerified ||
                    !(interaction.member?.permissions as PermissionsBitField).has(PermissionFlagsBits.ManageRoles)
                )
        );
        if (showTimeouts) {
            buttons.addComponents(new ButtonBuilder()
                .setCustomId("removeAllTimeouts")
                .setLabel("Remove all timeouts")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(Object.keys(timeoutResultsMap).length === 0)
            );
        }

        const components: ActionRowBuilder<BuilderType>[] = [];
        if (showTimeouts) {
            components.push(...timeoutSelect);
        } else {
            components.push(flagSelect);
        }
        components.push(buttons);

        const formatNote = (note: string) => note.split("\n").map((line) => `> ${line}`).join("\n");

        const embed = new EmbedBuilder()
            .setTitle("Mod Tools")
            .setDescription(
                `**Member:** <@${interaction.targetUser.id}>\n\n` +
                `**User note:** ${(userData.note ? `\n${formatNote(userData.note)}` : " *None set*")}\n\n` +
                `**Flags:** ${flagArray.filter(flag => flag).length}\n` +
                `**Timeouts:** ${Object.keys(timeoutResultsMap).length}` +
                (
                    Object.keys(timeoutResultsMap).length > 0
                        ? `\n> ${Object.keys(timeoutResultsMap).map((t) => `<#${t}>`).join(", ")}`
                        : "") +
                (showTimeouts ? `\n\nCurrently editing: <#${targetChannel}>` : "")
            )
            .setColor(Colours.Success);
        await interaction.editReply({ embeds: [embed], components: components});

        const i = await dualCollector(
            interaction
        );

        if (!i) { break; }
        const customId = i.customId;
        if (i.isStringSelectMenu() && customId === "flagSelect") {
            await i.deferUpdate();
            userData.flags = indexArrayToInteger(i.values.map((v) => parseInt(v)));
            updateDB = true;
        } else if (customId === "note") {
            await (i as ButtonInteraction).showModal(new ModalBuilder()
                .setTitle("Add a note")
                .setCustomId("modToolsModal")
                .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
                    .setCustomId("noteValue")
                    .setPlaceholder("Enter a note")
                    .setLabel("Note")
                    .setMaxLength(2000)
                    .setRequired(false)
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(userData.note || "")
                ))
            );
        } else if (i.isModalSubmit()) {
            let note = (i as ModalSubmitInteraction).fields.getField("noteValue")?.value;
            await i.deferUpdate();
            // Strip whitespace
            note = note?.trim() || "";
            userData.note = note;
            updateDB = true;
        } else if (i.isStringSelectMenu() && customId === "timeoutSelect") {
            await i.deferUpdate();
            const timeoutDuration = parseInt(i.values[0]!);
            timeoutResultsMap = await setTimeoutInChannel(timeoutDuration, targetChannel, interaction.targetUser.id, timeoutResultsMap);
        } else if (customId === "showTimeouts") {
            await i.deferUpdate();
            showTimeouts = !showTimeouts;
        } else if (i.isChannelSelectMenu() && customId === "channelSelect") {
            await i.deferUpdate();
            targetChannel = i.values[0]!;
        } else if (customId === "removeAllTimeouts") {
            await i.deferUpdate();
            await removeTimeouts(interaction.targetUser.id);
            timeoutResultsMap = {};
        } else if (customId === "ageVerify") {
            await i.deferUpdate();
            await (interaction.targetMember!.roles as GuildMemberRoleManager).add(data.roles.ageVerified);
        }
        if (!updateDB) { continue; }
        if (dbEntry) {
            await db.update(flags).set(userData).where(eq(flags.member, interaction.targetUser.id));
        } else {
            await db.insert(flags).values(userData);
            dbEntry = true;
        }
    } while (!breakOut);
};

const setTimeoutInChannel = async (
    interval: number,
    channel: string,
    member: string,
    results: Record<string, number>
) => {
    const db = await DB;
    // If the interval is 0, remove the timeout
    if (interval === 0) {
        await db.delete(timeouts).where(and(
            eq(timeouts.member, member),
            eq(timeouts.channel, channel)
        ));
        if (results[channel]) { delete results[channel]; }
        return results;
    }
    // Check if the user/channel combo already exists
    const timeoutResults = await db.select().from(timeouts).where(and(
        eq(timeouts.member, member),
        eq(timeouts.channel, channel)
    ));
    if (timeoutResults.length > 0) {
        // If it does, update the timeout
        await db.update(timeouts).set({
            frequency: interval
        }).where(and(
            eq(timeouts.member, member),
            eq(timeouts.channel, channel)
        ));
    } else {
        // If it doesn't, insert a new timeout
        await db.insert(timeouts).values({
            member: member,
            channel: channel,
            frequency: interval
        });
    }
    results[channel] = interval;
    client.timeoutsUpToDate = false;
    return results;
};

const removeTimeouts = async (member: string) => {
    const db = await DB;
    await db.delete(timeouts).where(eq(timeouts.member, member));
    client.timeoutsUpToDate = false;
};

export { userContextCallback, flagBits };
