// This file is for managing the secrets database
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
