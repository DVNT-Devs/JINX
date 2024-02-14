CREATE TABLE IF NOT EXISTS "secrets" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar NOT NULL,
	"message_id" varchar NOT NULL,
	"member_id" varchar NOT NULL
);
