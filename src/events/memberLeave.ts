import { GuildMember } from "discord.js";
import { deleteAllThreads } from "../actions/tickets";

const event = "guildMemberRemove";

const callback = async (member: GuildMember) => {
    await deleteAllThreads(member.guild, member.user);
};

export { event, callback };
