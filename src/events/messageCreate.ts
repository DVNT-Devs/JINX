import { Message } from "discord.js";
import data from "../data";
const triggers: Record<string, string> = data.triggers;

const event = "messageCreate";

const callback = (message: Message) => {
    if (message.author.bot) return;
    const lowerContent = message.content.toLowerCase();

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
