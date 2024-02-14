import { ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, PermissionFlagsBits } from "discord.js";
import data from "../../data";
import DB from "../../database/drizzle";
import { secrets } from "../../database/schema";
import { and, eq } from "drizzle-orm";


const command = new ContextMenuCommandBuilder()
    .setName("Who Sent This?")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false);

const callback = async (interaction: MessageContextMenuCommandInteraction) => {
    if (interaction.user.id !== data.users.pinea) {
        return interaction.reply({ content: `The user who sent this message is: <@${interaction.targetMessage.author.id}>`, ephemeral: true });
    }
    const db = await DB;
    const secret = await db.select().from(secrets).where(and(
        eq(secrets.channel, interaction.channel!.id),
        eq(secrets.message, interaction.targetMessage.id)
    ));
    if (!secret.length) { return interaction.reply({ content: "No secret found for this message.", ephemeral: true }); }
    const user = secret[0]?.member;
    await interaction.reply({ content: `The user who sent this secret is: ||<@${user}>||`, ephemeral: true });
};

export { command, callback };
