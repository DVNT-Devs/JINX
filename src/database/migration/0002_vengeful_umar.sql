CREATE TABLE IF NOT EXISTS "timeouts" (
	"member_id" varchar NOT NULL,
	"channel_id" varchar NOT NULL,
	"frequency" bigint DEFAULT 0 NOT NULL,
	"communication_disabled_until" timestamp DEFAULT '1970-01-01 00:00:00.000' NOT NULL,
	CONSTRAINT "timeouts_member_id_channel_id_pk" PRIMARY KEY("member_id","channel_id")
);
