CREATE TABLE IF NOT EXISTS "flags" (
	"member_id" varchar PRIMARY KEY NOT NULL,
	"note" varchar DEFAULT '' NOT NULL,
	"flags" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "flags_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "secrets" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar NOT NULL,
	"message_id" varchar NOT NULL,
	"member_id" varchar NOT NULL
);
