import { GuildMember } from "discord.js";
import { JinxClient } from "../client";


const secondsPerKick = 1.1;
const kicksPerSecond = 1 / secondsPerKick;

export default async (client: JinxClient) => {
    if (client.purgeLock) return;
    client.purgeLock = true;
    const guild = client.guilds.cache.get(process.env["HOST_GUILD"] || "")!;
    const roleToGive = "1202731550060445777";
    const verifiedRole = "1164256198489538653";
    const members = await guild.members.fetch();

    const unverifiedMembers = Array.from(members
        .filter(member => !member.roles.cache.has(verifiedRole))
        .filter(member => member.joinedAt!.getTime() < Date.now() - 1000 * 60 * 60 * 24 * 7 * 2));  // 2 weeks

    let i = 0;

    const execute = async (i: number) => {
        if (unverifiedMembers[i] === undefined) return;
        const currentMember = unverifiedMembers[i] as [string, GuildMember];
        const [id, fetchedMember] = currentMember;
        console.log(`Kicking ${fetchedMember.user.tag}...`);
        // If fetchedMember is undefined, use the id
        if (!fetchedMember) {
            const fetchedMember = await guild.members.fetch(id);
            if (!fetchedMember) return;
            await fetchedMember.kick(roleToGive);
        } else {
            await fetchedMember.kick(roleToGive);
        }
    };

    console.log(`${new Date().toLocaleTimeString()} - Kicking ${unverifiedMembers.length} unverified members...`);
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
