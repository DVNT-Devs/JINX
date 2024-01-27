const phrases: string[][] = [
    [
        "Subs like you shouldn't be degrading others",
        "You're not allowed to degrade others",
        "It isn't your place to degrade others",
        "You don't have the right to degrade others",
    ],
    [
        "Especially not",
        "You should be degrading yourself, not",
        "You're not allowed to degrade",
        "You don't have the right to degrade",
        "Why do you think you can degrade",
    ]
];


const choice = (arr: string[]) => {
    return arr[Math.floor(Math.random() * arr.length)] || "";
};


export const backfireResponse = (userId: string) => {
    return `${choice(phrases[0]!)}.\n${choice(phrases[1]!)} <@${userId}>.\nSo, `;
};
