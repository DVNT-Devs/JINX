import { Client, GatewayIntentBits, Interaction } from "discord.js";

class JinxClient extends Client {
    commands: Record<string, (interaction: Interaction) => unknown> = {};
    onInteractionHook: (interaction: Interaction) => unknown = () => { };
    phishing: string[] = [];
    purgeLock: boolean = false;

    timeoutsUpToDate = false;
    timeouts: {member: string, channel: string, frequency: number, communicationDisabledUntil: Date}[] = [];

    constructor() {
        super({ intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildModeration
        ] });
    }
}

const client: JinxClient = new JinxClient();

export default client;
export { JinxClient };
