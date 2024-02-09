import { GuildMember } from "discord.js";
import { Colours, contentRestrictions } from "../data";
import { EmbedBuilder } from "@discordjs/builders";

const event = "guildMemberUpdate";
const infractionsChannel = contentRestrictions.channels.banLogs;

const callback = async (before: GuildMember, after: GuildMember) => {
    if (before.communicationDisabledUntilTimestamp === after.communicationDisabledUntilTimestamp) return;
    const channel = await after.guild.channels.fetch(infractionsChannel);
    if (!channel) return;
    if (!channel.isTextBased()) return;

    const punishmentEnd = after.communicationDisabledUntil;
    if (!punishmentEnd) {
        await channel.send({ embeds: [new EmbedBuilder()
            .setTitle("Member Timeout Cancelled")
            .setDescription(
                `<@${after.id}>'s timeout was cancelled.\n` +
                `**Username:** ${after.user.username}\n` +
                `**ID:** \`${after.id}\``
            )
            .setThumbnail(after.displayAvatarURL())
            .setColor(Colours.Success)
            .setTimestamp()
        ]});
        return;
    }
    const duration = Math.ceil((punishmentEnd.getTime() - Date.now()) / 1000);
    if (duration <= 0) return;

    const days = Math.floor(duration / 86400);
    const hours = Math.floor((duration % 86400) / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    const durations = {days, hours, minutes, seconds};
    const toRender = Object.entries(durations).filter(([, value]) => value > 0).map(([key, value]) => `${value} ${key}`).join(", ");

    await channel.send({ embeds: [new EmbedBuilder()
        .setTitle("Member Timed Out")
        .setDescription(
            `<@${after.id}> was timed out.\n` +
            `**Username:** ${after.user.username}\n` +
            `**ID:** \`${after.id}\`\n` +
            `**Duration:** ${toRender}\n` +
            `**Ends:** <t:${Math.floor(punishmentEnd.getTime() / 1000)}:F> (<t:${Math.floor(punishmentEnd.getTime() / 1000)}:R>)`
        )
        .setThumbnail(after.displayAvatarURL())
        .setColor(Colours.Warning)
        .setTimestamp()
    ]});
};

export { event, callback };
