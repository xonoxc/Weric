CREATE TABLE "concept_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"source_concept" uuid NOT NULL,
	"target_concept" uuid NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concept_stories" (
	"concept_id" uuid NOT NULL,
	"story_id" uuid NOT NULL,
	CONSTRAINT "concept_stories_concept_id_story_id_pk" PRIMARY KEY("concept_id","story_id")
);
--> statement-breakpoint
CREATE TABLE "concepts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"name" text NOT NULL,
	"summary" text,
	"position_x" real,
	"position_y" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_source_concept_concepts_id_fk" FOREIGN KEY ("source_concept") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_target_concept_concepts_id_fk" FOREIGN KEY ("target_concept") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_stories" ADD CONSTRAINT "concept_stories_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_stories" ADD CONSTRAINT "concept_stories_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_concept_edges_chat_id" ON "concept_edges" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "idx_concept_edges_source" ON "concept_edges" USING btree ("source_concept");--> statement-breakpoint
CREATE INDEX "idx_concept_edges_target" ON "concept_edges" USING btree ("target_concept");--> statement-breakpoint
CREATE INDEX "idx_concept_stories_concept_id" ON "concept_stories" USING btree ("concept_id");--> statement-breakpoint
CREATE INDEX "idx_concept_stories_story_id" ON "concept_stories" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "idx_concepts_chat_id" ON "concepts" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "idx_concepts_name" ON "concepts" USING btree ("name");