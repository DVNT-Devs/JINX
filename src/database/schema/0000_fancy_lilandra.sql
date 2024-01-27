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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "punishments" ADD CONSTRAINT "punishments_sub_id_users_id_fk" FOREIGN KEY ("sub_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "relationships" ADD CONSTRAINT "relationships_dom_id_users_id_fk" FOREIGN KEY ("dom_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "relationships" ADD CONSTRAINT "relationships_sub_id_users_id_fk" FOREIGN KEY ("sub_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
