import { CommandInteraction } from "discord.js";
import { Data as DisciplineData, ModuleReturnData } from "../../commands/discipline";
import DB from "../../database/drizzle";
import { relationships } from "../../database/schema";
import { eq } from "drizzle-orm";

export default async function (interaction: CommandInteraction, data: DisciplineData): Promise<ModuleReturnData> {
    const db = await DB;
    // Check if the user a dom to someone (domsAccepted includes the user)
    const isDom = data.domsAccepted.includes(interaction.user.id);
    // Load the database to check if the user is a sub to someone (subsAccepted includes the user)
    const isSub = (await db.select().from(relationships).where(eq(relationships.sub, interaction.user.id))).length > 0;

    // If the user is neither a dom nor a sub, return an error
    if (!isDom && !isSub) { return { persist: true, data }; }

    // If the user is only a sub, show them their punishments
    if (!isDom) { await subUI(data, interaction); return { persist: false, data }; }
    else if (!isSub) { await domUI(data, interaction); return { persist: false, data }; }

    return { persist: true, data };
}

const subUI = (data: DisciplineData, interaction: CommandInteraction) => {
    console.log(data, interaction);
};

const domUI = (data: DisciplineData, interaction: CommandInteraction) => {
    console.log(data, interaction);
};
