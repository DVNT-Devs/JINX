import { CommandInteraction } from "discord.js";
import { Data as DisciplineData } from "../../commands/discipline";
import { EmbedBuilder } from "@discordjs/builders";

export default async function invites(interaction: CommandInteraction, data: DisciplineData): Promise<boolean> {
    const breakOut = false;

    
    do {
        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setTitle("Invites")
            .setDescription("You have no pending invites")
        ] });
    } while (!breakOut);
    return true;
}
