CREATE TABLE "story" (
	"id" text PRIMARY KEY NOT NULL,
	"child_id" text NOT NULL,
	"household_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"age_band" "age_band" NOT NULL,
	"choices" jsonb NOT NULL,
	"content" jsonb NOT NULL,
	"source" text NOT NULL,
	"pictures" jsonb NOT NULL,
	"reference_url" text,
	"seed" integer NOT NULL,
	"versions" jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_draft" (
	"child_id" text PRIMARY KEY NOT NULL,
	"choices" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_narration" (
	"story_id" text PRIMARY KEY NOT NULL,
	"child_id" text NOT NULL,
	"day" date NOT NULL,
	"pages" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "voice_session" ADD COLUMN "purpose" text DEFAULT 'talk' NOT NULL;--> statement-breakpoint
ALTER TABLE "story" ADD CONSTRAINT "story_child_id_child_profile_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_draft" ADD CONSTRAINT "story_draft_child_id_child_profile_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_narration" ADD CONSTRAINT "story_narration_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "story_child_idx" ON "story" USING btree ("child_id","created_at");--> statement-breakpoint
CREATE INDEX "story_narration_child_day_idx" ON "story_narration" USING btree ("child_id","day");