import { Message } from "discord.js";
import data, { Colours, contentRestrictions } from "../utils/data";
import client from "../client";
import { EmbedBuilder } from "@discordjs/builders";
import { reportContent } from "../context/message/reportContent";
import DB from "../database/drizzle";
import { timeouts } from "../database/schema";
import { and, eq } from "drizzle-orm";
const triggers: Record<string, string> = data.triggers;

const event = "messageCreate";

const callback = async (message: Message) => {
    if (message.author.bot) return;

    if (await checkTimeouts(message)) return;

    if (await checkDomains(message)) return;
    if (await checkAttachments(message)) return;

    if (await checkTriggers(message)) return;
};

const checkDomains = async (message: Message) => {
    const domains = message.content.toLowerCase().match(/(?<=:\/\/)[a-z0-9-]+(?:\.[a-z0-9-]+)+/g);
    if (!domains) return;
    for (const domain of domains) {
        if (!client.phishing.includes(domain)) continue;
        // Leave the first 3 characters, and replace everything after it (that isn't a . or /) with asterisks
        const censoredDomain = domain.slice(0, 3) + domain.slice(3).replace(/[^./]/g, "*");
        await message.delete();
        const m = await message.channel!.send({embeds: [new EmbedBuilder()
            .setTitle("Phishing link detected")
            .setDescription(
                `This link \`(${censoredDomain})\` has been listed as a phishing site.\n` +
                "We've removed your message - Please contact a moderator if you believe this is a mistake."
            )
            .setFooter({text: "This message will be deleted in 20 seconds"})
            .setColor(Colours.Danger)
        ], content: `<@${message.author.id}>`});
        setTimeout(() => void m.delete(), 20 * 1000);
        return true;
    }
};

const checkTimeouts = async (message: Message) => {
    if (!client.timeoutsUpToDate) {
        const db = await DB;
        client.timeouts = await db.select().from(timeouts);
        client.timeoutsUpToDate = true;
    }

    const timeoutResults = client.timeouts.filter(t => t.member === message.author.id && t.channel === message.channel.id);

    if (timeoutResults.length === 0) return false;
    const timeout = timeoutResults[0];
    if (!timeout) return false;

    if (timeout.communicationDisabledUntil > new Date()) {
        // Cannot speak until a time in the future
        await message.delete();
        const discordTimestamp = Math.floor(timeout.communicationDisabledUntil.getTime() / 1000);

        const secondsToRead = 15;
        const timeInFewSeconds = Math.floor((new Date().getTime() + secondsToRead * 1000) / 1000);
        const m = await message.channel.send({
            content: `You have reached your post limit in this channel for now, <@${message.author.id}>.\n` +
            `Try again <t:${discordTimestamp}:R> (<t:${discordTimestamp}:f>)\n` +
            "Feel free to post in other channels in the meantime!" +
            `This message will self-destruct <t:${timeInFewSeconds}:R>`
        });
        setTimeout(() => void m.delete(), secondsToRead * 1000);
        return true;
    }

    const db = await DB;
    await db.update(timeouts).set({
        communicationDisabledUntil: new Date(new Date().getTime() + timeout.frequency * 1000)
    }).where(and(
        eq(timeouts.member, message.author.id),
        eq(timeouts.channel, message.channel.id)
    ));
    client.timeoutsUpToDate = false;

    return false;
};

const checkAttachments = async (message: Message) => {
    // If there are no attachments, we don't need to do anything
    if (message.attachments.size === 0) return;
    // If the channel doesn't have rules, we don't need to do anything
    if(!Object.keys(contentRestrictions.reports).includes(message.channel.id)) return;
    // Define the rules for the channel
    const rules = contentRestrictions.reports[message.channel.id as keyof typeof contentRestrictions.reports] as {enforceSpoilers?: boolean};
    // And if they don't care about spoilers, we don't need to do anything
    if (!rules.enforceSpoilers) return;
    // Only check images and videos
    const isAllowedType = (type: string) => type.startsWith("image") || type.startsWith("video");
    const attachments = message.attachments.filter(a => isAllowedType(a.contentType || ""));
    // If every attachment is allowed, we don't need to do anything
    if (attachments.every(a => a.name.startsWith("SPOILER_"))) return;

    // Delete the message
    await reportContent(message, 0, undefined, undefined, true);
    return true;
};

const checkTriggers = async (message: Message) => {
    for (const [trigger, response] of Object.entries(triggers)) {
        if (!message.content.toLowerCase().includes(trigger)) continue;
        await message.reply(response);
        return true;
    }
};

export {
    event,
    callback
};
