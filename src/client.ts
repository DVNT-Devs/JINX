import { Client, GatewayIntentBits } from "discord.js";

class JinxClient extends Client {
    commands: Record<string, (interaction: any) => any> = {};

    constructor() {
        super({ intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent
        ] });
    }
}

const client: JinxClient = new JinxClient();

export default client;
export { JinxClient };
