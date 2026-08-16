CREATE TABLE "chat_stories" (
	"chat_id" uuid NOT NULL,
	"story_id" uuid NOT NULL,
	CONSTRAINT "chat_stories_chat_id_story_id_pk" PRIMARY KEY("chat_id","story_id")
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"query" text,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_stories" ADD CONSTRAINT "chat_stories_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_stories" ADD CONSTRAINT "chat_stories_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_stories_chat_id" ON "chat_stories" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "idx_chat_stories_story_id" ON "chat_stories" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "idx_chats_user_id" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_chats_updated_at" ON "chats" USING btree ("updated_at");