import { Client, GatewayIntentBits, Interaction } from "discord.js";

class JinxClient extends Client {
    commands: Record<string, (interaction: Interaction) => unknown> = {};
    onInteractionHook: (interaction: Interaction) => unknown = () => { };

    constructor() {
        super({ intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessages,
        ] });
    }
}

const client: JinxClient = new JinxClient();

export default client;
export { JinxClient };
