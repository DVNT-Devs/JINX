import { GuildMember } from "discord.js";
import data from "../data";
import { readFileSync } from "fs";
import { join } from "path";

const domRole = data.roles.dom;
const subRole = data.roles.sub;

const suggestionsPath = join(__dirname, "..", "..", "globals", "suggestions.json");

const responseFrom = (target: GuildMember, listName: keyof typeof data) => {
    const wordList = data[listName] as Record<string, string[]>;

    // Add suggested phrases live (if suggested, they should be added to the list immediately)
    let suggestions;
    try {
        suggestions = JSON.parse(readFileSync(suggestionsPath, "utf-8"));
    } catch (_error) { suggestions = {}; }
    const suggestedPhrases = suggestions[listName] as Record<string, string[]>;
    if (suggestedPhrases) {
        // There will be a list of "dom", "sub", and "everyone" phrases
        // Add "everyone" to wordList["*"]
        wordList["*"] = (wordList["*"] || []).concat(suggestedPhrases["everyone"] || []);
        // Add "dom" to wordList[domRole]
        wordList[domRole] = (wordList[domRole] || []).concat(suggestedPhrases["dom"] || []);
        // Add "sub" to wordList[subRole]
        wordList[subRole] = (wordList[subRole] || []).concat(suggestedPhrases["sub"] || []);
    }

    const allPhrases = wordList["*"] || [];
    let customPhrases: string[] = [];

    const idPool = [target.id]
        .concat(target.roles.cache.map(role => role.id));
    // If it includes data.roles.switch, add dom and sub to the pool
    if (idPool.includes(data.roles.switch)) {
        idPool.push(data.roles.dom, data.roles.sub);
    }

    for (const id of idPool) {
        if (id in wordList) {
            customPhrases = customPhrases.concat(wordList[id] as string[]);
        }
    }

    const phrases = allPhrases.concat(customPhrases);

    const selected = phrases[Math.floor(Math.random() * phrases.length)];

    return selected;
};


export { responseFrom };
