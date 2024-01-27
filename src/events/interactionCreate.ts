import { Interaction } from "discord.js";
import onboardCallback from "../actions/onboard";
import { rulesInChannel } from "../context/message/reportContent";
import { callback as secretCallback } from "../commands/secret";
import { denySuggestion, approveSuggestion } from "../commands/suggest";

const event = "interactionCreate";

const callback = (interaction: Interaction) => {
    if (interaction.isButton()) {
        const id = interaction.customId;
        if (id === "global:onboard") { onboardCallback(interaction, true); }
        else if (id === "global:rules") { rulesInChannel(interaction); }
        else if (id === "global:secret") { secretCallback(interaction); }
        else if (id.startsWith("global:mod/deny")) { denySuggestion(interaction); }
        else if (id.startsWith("global:mod/approve")) { approveSuggestion(interaction); }
    }
};

export {
    event,
    callback
};
