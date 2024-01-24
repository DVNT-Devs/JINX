import { Message } from "discord.js";
import data, { Colours } from "../data";
import client from "../client";
import { EmbedBuilder } from "@discordjs/builders";
const triggers: Record<string, string> = data.triggers;

const event = "messageCreate";

const callback = async (message: Message) => {
    if (message.author.bot) return;
    const lowerContent = message.content.toLowerCase();

    // Importantly, we need to check for any URLs in the message
    // We can use a regex for this. We only need the domain - i.e. google.com, and no more.
    // The regex should check it starts with :// of course, but not include it in the list
    const domains = lowerContent.match(/(?<=:\/\/)[a-z0-9-]+(?:\.[a-z0-9-]+)+/g);
    if (domains) {
        for (const domain of domains) {
            if (client.phishing.includes(domain)) {
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
                setTimeout(() => m.delete(), 20 * 1000);
                return;
            }
        }
    }

    if (Object.keys(triggers).includes(lowerContent)) {
        const response = triggers[lowerContent];
        if (response) {
            message.reply(response);
        }
    }
};

export {
    event,
    callback
};
