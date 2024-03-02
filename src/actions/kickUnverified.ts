import { GuildMember, GuildTextBasedChannel } from "discord.js";
import { JinxClient } from "../client";


const secondsPerKick = 1.25;
const kicksPerSecond = 1 / secondsPerKick;

export default async (client: JinxClient) => {
    if (client.purgeLock) return;
    client.purgeLock = true;
    const guild = client.guilds.cache.get(process.env["HOST_GUILD"] || "")!;
    const verifiedRole = "1164256198489538653";
    const sendChannelId = "1213474410996957285";

    const emojiIDs = [
        "1169338343851557045",  "1169815358824263720",  "1179834075234713611",
        "a1169031440541945977", "a1179590287606169711", "1169475073107832954",
        "a1179834077336064050", "1169031443855458435",  "1169031822626279595"
    ];
    const phrases = [
        "You will not be missed",
        "Goodbye",
        "Don't let the door hit you on the way out",
        "Send your mom my regards",
        "Send a postcard",
        "Good riddance",
        "Nice knowing you",
        "Sayonara",
        "You now have my permission to cry",
        "Hasta la vista",
        "Viva la revolución"
    ];

    const emojiIDToMention = (id: string) => {
        return id.startsWith("a") ? `<a:N:${id.slice(1)}>` : `<:N:${id}>`;
    };
    const selectRandomEmoji = () => { return emojiIDToMention(emojiIDs[Math.floor(Math.random() * emojiIDs.length)]!); };
    const selectRandomPhrase = () => { return phrases[Math.floor(Math.random() * phrases.length)]; };

    const members = await guild.members.fetch();
    const sendChannel = guild.channels.cache.get(sendChannelId)! as GuildTextBasedChannel;

    const unverifiedMembers = Array.from(members
        .filter(member => !member.roles.cache.has(verifiedRole))
        .filter(member => member.joinedAt!.getTime() < Date.now() - 1000 * 60 * 60 * 24 * 7 * 2));  // 2 weeks

    let i = 0;

    const execute = async (i: number) => {
        if (unverifiedMembers[i] === undefined) return;
        const currentMember = unverifiedMembers[i] as [string, GuildMember];
        const [id, fetchedMember] = currentMember;
        console.log(`\x1b[31mKicking ${fetchedMember.user.tag}...\x1b0`);
        // If fetchedMember is undefined, use the id
        if (!fetchedMember) {
            const fetchedMember = await guild.members.fetch(id);
            if (!fetchedMember) return;
            await fetchedMember.kick();
        } else {
            await fetchedMember.kick();
        }
        const joinTimestamp = Math.floor(fetchedMember.joinedAt!.getTime() / 1000);
        await sendChannel.send(
            `${selectRandomEmoji()} Kicked ${fetchedMember.user.username} (Joined <t:${joinTimestamp}:R>) ` +
            `- ${selectRandomPhrase()}`
        );
    };

    console.log(`\x1b[31m${new Date().toLocaleTimeString()} - Kicking ${unverifiedMembers.length} unverified members...`);
    console.log(`ETA: ${Math.round((unverifiedMembers.length * secondsPerKick) / 60)} minutes\x1b0`);
    await setInterval(() => {
        if (i < unverifiedMembers.length) {
            void execute(i);
            i++;
        }
    }, kicksPerSecond * 1000);
    // Wait until all members are kicked, then unlock the purge
    await new Promise(resolve => setTimeout(resolve, unverifiedMembers.length * kicksPerSecond * 1000));
    client.purgeLock = false;
};
