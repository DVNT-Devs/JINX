import { ApplicationCommandType, Client, ContextMenuCommandBuilder, Events, Routes, SlashCommandBuilder } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import client from "../client";

export default (discordClient: Client ) => {
    console.group("Command Registration");
    console.log("Reading commands folder");
    // const client_id = client.user!.id;
    // const guild_id = process.env["HOST_GUILD"];
    const commandsFolder = path.join(__dirname, "commands");
    const commandFiles = readdirSync(commandsFolder).filter(file => file.endsWith(".js"));
    const commands: (SlashCommandBuilder | ContextMenuCommandBuilder)[] = [];

    const eventsFolder = path.join(__dirname, "events");
    const eventFiles = readdirSync(eventsFolder).filter(file => file.endsWith(".js"));

    const messageContextFolder = path.join(__dirname, "context", "message");
    const messageContextFiles = readdirSync(messageContextFolder).filter(file => file.endsWith(".js"));
    const userContextFolder = path.join(__dirname, "context", "user");
    const userContextFiles = readdirSync(userContextFolder).filter(file => file.endsWith(".js"));

    (async () => {
        for (const file of commandFiles) {
            const filePath = path.join(commandsFolder, file);
            const command = await import(filePath);
            if (!command.command || !command.callback) {
                console.error(`Command ${file} is missing a command or callback export`);
                return;
            }
            commands.push(command.command);
            client.commands["message." + command.command.name] = command.callback;
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
        for (const file of messageContextFiles) {
            const filePath = path.join(messageContextFolder, file);
            const context = await import(filePath);
            if (!context.command || !context.callback) {
                console.error(`Message context ${file} is missing a command or callback export`);
                return;
            }
            context.command.setType(ApplicationCommandType.Message);
            client.commands["messageContext." + context.command.name] = context.callback;
            commands.push(context.command);
            console.log(`Registered message context ${context.command.name}`);
        }
        for (const file of userContextFiles) {
            const filePath = path.join(userContextFolder, file);
            const context = await import(filePath);
            if (!context.command || !context.callback) {
                console.error(`User context ${file} is missing a command or callback export`);
                return;
            }
            context.command.setType(ApplicationCommandType.User);
            client.commands["userContext." + context.command.name] = context.callback;
            commands.push(context.command);
            console.log(`Registered user context ${context.command.name}`);
        }

        // Check if "--update-commands" is in the arguments
        if (process.argv.includes("--update-commands")) {
            try {
                console.log(`Started refreshing ${commands.length} application (/) commands.`);

                // The put method is used to fully refresh all commands in the guild with the current set
                const commandData: Array<unknown> = await discordClient.rest.put(
                    Routes.applicationGuildCommands(discordClient.user!.id, process.env["HOST_GUILD"] || ""),
                    { body: commands.map(command => command.toJSON()) }
                ) as Array<unknown>;
                console.log(`Successfully reloaded ${commandData.length} application (/) commands.`);
            } catch (error) {
                // And of course, make sure you catch and log any errors!
                console.error(error);
            }
        }
        console.groupEnd();
    })();
};
