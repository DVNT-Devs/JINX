import { join } from "path";
import { readFile } from "fs/promises";
// This file is for managing data/secrets.json
import { and, eq } from "drizzle-orm";
import DB from "../database/drizzle";
import { secrets } from "../database/schema";

export async function getUserId(channelId: string, messageId: string): Promise<string | undefined> {
    const db = await DB;
    const results = await db.select().from(secrets).where(and(eq(secrets.channel, channelId), eq(secrets.message, messageId)));
    return results[0]?.member;
}

export async function logSecret(channelId: string, messageId: string, userId: string): Promise<void> {
    const db = await DB;
    await db.insert(secrets).values({ channel: channelId, message: messageId, member: userId });
}

export async function migrateFromJson(): Promise<void> {
    const db = await DB;
    const secretsJson = await readFile(join(__dirname, "..", "..", "globals", "secrets.json"), "utf-8");
    // Key is channelId.messageId, value is userId
    const parsed = JSON.parse(secretsJson) as Record<string, string>;
    for (const key in parsed) {
        const [channel, message] = key.split(".") as [string, string];
        console.log(parsed[key], channel, message);
        await db.insert(secrets).values({
            channel: channel,
            message: message,
            member: parsed[key] as string
        });
    }
}
