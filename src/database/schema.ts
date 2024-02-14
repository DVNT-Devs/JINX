import { uuid } from "drizzle-orm/pg-core";
import { pgTable, varchar, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";


// Discipline command
export const relationships = pgTable("relationships", {
    dom: varchar("dom_id").notNull(),
    sub: varchar("sub_id").notNull(),
    accepted: boolean("accepted").notNull().default(false),
    accepted_timestamp: timestamp("created").notNull().defaultNow()
}, (table) => ({
    id: primaryKey({ columns: [table.dom, table.sub]})
}));

export const punishments = pgTable("punishments", {
    punishment_id: uuid("punishment_id").notNull().defaultRandom().primaryKey(),
    sub: varchar("sub_id").notNull(),
    setBy: varchar("set_by").notNull(),
    punishment: varchar("punishment").notNull(),
    expires: timestamp("expires").notNull()
});

export const challenges = pgTable("challenges", {
    challenge_id: uuid("challenge_id").notNull().defaultRandom().primaryKey(),
    sub: varchar("sub_id").notNull(),
    setBy: varchar("set_by").notNull(),
    challenge: varchar("challenge").notNull(),
    created: timestamp("created").notNull()
});

// Secrets backup
export const secrets = pgTable("secrets", {
    uuid: uuid("uuid").notNull().defaultRandom().primaryKey(),
    channel: varchar("channel_id").notNull(),
    message: varchar("message_id").notNull(),
    member: varchar("member_id").notNull()
});
