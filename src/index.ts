import { Events } from "discord.js";
import client from "./client";
import dotenv from "dotenv";
import registerEvents from "./actions/registerEvents";
import { updatePhishing } from "./phishing";
// import kickUnverified from "./actions/kickUnverified";

dotenv.config();

// Run once when the bot starts up
client.once(Events.ClientReady, discordClient => {
    registerEvents(discordClient);
    void updatePhishing().then(domains => {
        client.phishing = domains;
    });

    // Every hour, check for unverified members and kick them
    // We also run it once on startup

    // Due to event timing, we will be disabling this for now

    /*
    void kickUnverified(client);
    setInterval(() => {
        void kickUnverified(client);
    }, 1000 * 60 * 60);
    */
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
    } else if (interaction.isUserContextMenuCommand()) {
        const command = client.commands["userContext." + interaction.commandName];
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
void client.login(process.env["TOKEN"]);
