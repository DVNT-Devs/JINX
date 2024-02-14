CREATE TABLE IF NOT EXISTS "challenges" (
	"challenge_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_id" varchar NOT NULL,
	"set_by" varchar NOT NULL,
	"challenge" varchar NOT NULL,
	"created" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "punishments" (
	"punishment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_id" varchar NOT NULL,
	"set_by" varchar NOT NULL,
	"punishment" varchar NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "relationships" (
	"dom_id" varchar NOT NULL,
	"sub_id" varchar NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "relationships_dom_id_sub_id_pk" PRIMARY KEY("dom_id","sub_id")
);
