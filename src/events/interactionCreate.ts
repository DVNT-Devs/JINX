import { Interaction } from "discord.js";
import onboardCallback from "../actions/onboard";
import { rulesInChannel } from "../context/message/reportContent";
import { callback as secretCallback } from "../commands/secret";
import { denySuggestion, approveSuggestion } from "../commands/suggest";

const event = "interactionCreate";

const callback = async (interaction: Interaction) => {
    if (interaction.isButton()) {
        const id = interaction.customId;
        if (id === "global:onboard") { await onboardCallback(interaction, true); }
        else if (id === "global:rules") { await rulesInChannel(interaction); }
        else if (id === "global:secret") { await secretCallback(interaction); }
        else if (id.startsWith("global:mod/deny")) { await denySuggestion(interaction); }
        else if (id.startsWith("global:mod/approve")) { await approveSuggestion(interaction); }
    }
};

export {
    event,
    callback
};
