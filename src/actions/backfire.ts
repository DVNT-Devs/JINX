const degradePhrases: string[][] = [
    [
        "Subs like you shouldn't be degrading others",
        "You're not allowed to degrade others",
        "It isn't your place to degrade others",
        "You don't have the right to degrade others",
    ],
    [
        "Especially not",
        "You should be degrading yourself, not",
        "You aren't allowed to try and bully",
        "You don't have the *right* to say mean things to",
        "Why do you think you can bully",
    ]
];
const praisePhrases: string[][] = [
    [
        "You're not meant to praise them, silly",
        "You shouldn't be praising them",
        "The right to praise others is earned",
        "You may have made a mistake",
        "Just no"
    ],
    [
        "You can always ask",
        "The one who allows praise is",
        "You're going to have to ask for the right to praise from",
        "And the answer will always be a no from",
        "You should be praising yourself, not",
        "Now it's your turn to be praised, not",
        "Why do you think you can compliment"
    ]
];

const phraseObject = {
    degrade: degradePhrases,
    praise: praisePhrases
};


const choice = (arr: string[]) => {
    return arr[Math.floor(Math.random() * arr.length)] || "";
};


export const backfireResponse = (userId: string, type: "degrade" | "praise" = "degrade") => {
    const phrases = phraseObject[type];
    return `${choice(phrases[0]!)}.\n${choice(phrases[1]!)} <@${userId}>.\nSo, `;
};
