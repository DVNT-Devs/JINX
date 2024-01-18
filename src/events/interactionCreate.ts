import { Interaction } from "discord.js";
import onboardCallback from "../actions/onboard";

const event = "interactionCreate";

const callback = (interaction: Interaction) => {
    if (interaction.isButton()) {
        const id = interaction.customId;
        if (id === "global:onboard") { onboardCallback(interaction, true); }
    }
};

export {
    event,
    callback
};
