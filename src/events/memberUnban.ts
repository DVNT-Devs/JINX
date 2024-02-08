import { GuildBan } from "discord.js";
import { Colours, contentRestrictions } from "../data";
import { EmbedBuilder } from "@discordjs/builders";

const event = "guildBanRemove";
const infractionsChannel = contentRestrictions.channels.banLogs;

const callback = async (ban: GuildBan) => {
    const { guild, user } = ban;
    const channel = await guild.channels.fetch(infractionsChannel);
    if (!channel) return;
    if (!channel.isTextBased()) return;

    await channel.send({ embeds: [new EmbedBuilder()
        .setTitle("Member Unbanned")
        .setDescription(
            `<@${user.id}> was unbanned from the server.\n` +
            `**Username:** ${user.username}\n` +
            `**ID:** \`${user.id}\``
        )
        .setThumbnail(user.displayAvatarURL())
        .setColor(Colours.Success)
        .setTimestamp()
    ]});
};

export { event, callback };
