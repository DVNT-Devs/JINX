import { SlashCommandBuilder } from "discord.js";
import onboardingCallback from "../actions/onboard";


const onboard = new SlashCommandBuilder()
    .setName("onboard")
    .setDescription("Walks you through the roles in the server");


const callback = async (interaction: any) => {
    await onboardingCallback(interaction, false);
};

export {
    onboard as command,
    callback
};
