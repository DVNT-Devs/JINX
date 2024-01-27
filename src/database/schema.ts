import { pgTable, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const relationships = pgTable("relationships", {
    dom: varchar("dom_id").notNull(),
    sub: varchar("sub_id").notNull(),
    accepted: boolean("accepted").notNull().default(false),
    accepted_timestamp: timestamp("created").notNull().defaultNow()
});

export const punishments = pgTable("punishments", {
    sub: varchar("sub_id").notNull(),
    punishment: varchar("punishment").notNull(),
    expires: timestamp("expires").notNull()
});
