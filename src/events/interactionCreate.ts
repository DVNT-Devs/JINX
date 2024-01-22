import { Interaction } from "discord.js";
import onboardCallback from "../actions/onboard";
import { rulesInChannel } from "../context/message/reportContent";

const event = "interactionCreate";

const callback = (interaction: Interaction) => {
    if (interaction.isButton()) {
        const id = interaction.customId;
        if (id === "global:onboard") { onboardCallback(interaction, true); }
        else if (id === "global:rules") { rulesInChannel(interaction); }
    }
};

export {
    event,
    callback
};
