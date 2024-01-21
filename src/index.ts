import { Events } from "discord.js";
import client from "./client";
import dotenv from "dotenv";
import registerEvents from "./registerEvents";

dotenv.config();

// Run once when the bot starts up
client.once(Events.ClientReady, discordClient => {
    registerEvents(discordClient);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands["message." + interaction.commandName];
        if (!command) return;
        try {
            await command(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: "There was an error while executing this command" });
            } else {
                await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
            }
        }
        return;
    } else if (interaction.isMessageContextMenuCommand()) {
        const command = client.commands["messageContext." + interaction.commandName];
        if (!command) return;
        try {
            await command(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: "There was an error while executing this command" });
            } else {
                await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
            }
        }
        return;
    }

    // If it wasn't caught here, pass it into the hook
    client.onInteractionHook(interaction);
});

client.on(Events.Error, console.error);

process.on("unhandledRejection", (err) => {
    console.error(err);
});
process.on("uncaughtException", (err) => {
    console.error(err);
});

// Log in to Discord with your client's token
client.login(process.env["TOKEN"]);
