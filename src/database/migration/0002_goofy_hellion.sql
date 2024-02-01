ALTER TABLE "relationships" DROP CONSTRAINT "relationships_dom_id_sub_id_pk";--> statement-breakpoint
ALTER TABLE "relationships" ADD COLUMN "relationship_id" uuid DEFAULT gen_random_uuid() NOT NULL;