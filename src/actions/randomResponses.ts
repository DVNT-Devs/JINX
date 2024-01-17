import { GuildMember } from "discord.js";
import data from "../data";


const responseFrom = (target: GuildMember, listName: keyof typeof data) => {
    const wordList = data[listName] as Record<string, string[]>;
    let phrases = wordList["*"] || [];

    const idPool = [target.id]
        .concat(target.roles.cache.map(role => role.id));
    // If it includes data.roles.switch, add dom and sub to the pool
    if (idPool.includes(data.roles.switch)) {
        idPool.push(data.roles.dom, data.roles.sub);
    }

    for (const id of idPool) {
        if (id in wordList) {
            phrases = phrases.concat(wordList[id] as string[]);
        }
    }

    const selected = phrases[Math.floor(Math.random() * phrases.length)];

    return selected;
};


export { responseFrom };