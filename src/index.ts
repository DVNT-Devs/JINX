import { Events, Routes, SlashCommandBuilder } from "discord.js";
import client from "./client";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import path from "path";
dotenv.config();

// Run once when the bot starts up
client.once(Events.ClientReady, discordClient => {
    console.group("Command Registration");
    console.log("Reading commands folder");
    // const client_id = client.user!.id;
    // const guild_id = process.env["HOST_GUILD"];
    const commandsFolder = path.join(__dirname, "commands");
    const commandFiles = readdirSync(commandsFolder).filter(file => file.endsWith(".js"));
    const commands: SlashCommandBuilder[] = [];

    const eventsFolder = path.join(__dirname, "events");
    const eventFiles = readdirSync(eventsFolder).filter(file => file.endsWith(".js"));

    (async () => {
        for (const file of commandFiles) {
            const filePath = path.join(commandsFolder, file);
            const command = await import(filePath);
            if (!command.command || !command.callback) {
                console.error(`Command ${file} is missing a command or callback export`);
                return;
            }
            commands.push(command.command);
            client.commands["message" + command.command.name] = command.callback;
            console.log(`Registered command ${command.command.name}`);
        }
        for (const file of eventFiles) {
            const filePath = path.join(eventsFolder, file);
            const event = await import(filePath);
            if (!event.event || !event.callback) {
                console.error(`Event ${file} is missing an event or callback export`);
                return;
            }
            if (event.event === Events.InteractionCreate) {
                client.onInteractionHook = event.callback;
            } else {
                discordClient.on(event.event, event.callback);
            }
            console.log(`Registered event ${event.event}`);
        }

        // Check if "--update-commands" is in the arguments
        if (process.argv.includes("--update-commands")) {
            try {
                console.log(`Started refreshing ${commands.length} application (/) commands.`);

                // The put method is used to fully refresh all commands in the guild with the current set
                const commandData: any = await discordClient.rest.put(
                    Routes.applicationGuildCommands(discordClient.user.id, process.env["HOST_GUILD"] || ""),
                    { body: commands.map(command => command.toJSON()) }
                );
                console.log(`Successfully reloaded ${commandData.length} application (/) commands.`);
            } catch (error) {
                // And of course, make sure you catch and log any errors!
                console.error(error);
            }
        }
        console.groupEnd();
    })();
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands["message" + interaction.commandName];
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
