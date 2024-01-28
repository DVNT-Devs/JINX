CREATE TABLE IF NOT EXISTS "punishments" (
	"sub_id" varchar NOT NULL,
	"punishment" varchar NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "relationships" (
	"dom_id" varchar NOT NULL,
	"sub_id" varchar NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);
