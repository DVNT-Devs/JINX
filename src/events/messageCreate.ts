import { Message } from "discord.js";
import data, { Colours, contentRestrictions } from "../data";
import client from "../client";
import { EmbedBuilder } from "@discordjs/builders";
import { reportContent } from "../context/message/reportContent";
const triggers: Record<string, string> = data.triggers;

const event = "messageCreate";

const callback = async (message: Message) => {
    if (message.author.bot) return;

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
