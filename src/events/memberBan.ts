import { GuildBan } from "discord.js";
import { Colours, contentRestrictions } from "../data";
import { EmbedBuilder } from "@discordjs/builders";

const event = "guildBanAdd";
const infractionsChannel = contentRestrictions.channels.banLogs;

const callback = async (ban: GuildBan) => {
    const { guild, user } = ban;
    const channel = await guild.channels.fetch(infractionsChannel);
    if (!channel) return;
    if (!channel.isTextBased()) return;

    await channel.send({ embeds: [new EmbedBuilder()
        .setTitle("Member Banned")
        .setDescription(
            `<@${user.id}> was banned from the server.\n` +
            `**Username:** ${user.username}\n` +
            `**ID:** \`${user.id}\`\n` +
            `**Reason:** ${ban.reason ?? "*No reason provided*"}`
        )
        .setThumbnail(user.displayAvatarURL())
        .setColor(Colours.Danger)
        .setTimestamp()
    ]});
};

export { event, callback };
