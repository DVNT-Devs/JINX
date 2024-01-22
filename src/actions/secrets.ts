// This file is for managing data/secrets.json

import { promises as fs } from "fs";
import { join } from "path";

const secretsPath = join(__dirname, "..", "..", "secrets.json");
// If the file doesn't exist, create it
fs.access(secretsPath).catch(() => fs.writeFile(secretsPath, "{}"));

export interface Secrets {
    id: string;  // The channel id and message id concatenated together
    user: string;
}

export async function getUserId(channelId: string, messageId: string): Promise<string | undefined> {
    const secrets = JSON.parse(await fs.readFile(secretsPath, "utf-8") || "{}") as Record<string, string>;
    return secrets[`${channelId}.${messageId}`];
}

export async function logSecret(channelId: string, messageId: string, userId: string): Promise<void> {
    const key = `${channelId}.${messageId}`;
    const secrets = JSON.parse(await fs.readFile(secretsPath, "utf-8") || "{}") as Record<string, string>;
    secrets[key] = userId;
    await fs.writeFile(secretsPath, JSON.stringify(secrets, null, 2));
}
