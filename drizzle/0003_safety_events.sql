CREATE TABLE "safety_event" (
	"id" text PRIMARY KEY NOT NULL,
	"child_id" text,
	"household_id" text,
	"category" text NOT NULL,
	"severity" integer NOT NULL,
	"level" text NOT NULL,
	"actor_class" text,
	"feature" text NOT NULL,
	"locale" text NOT NULL,
	"phase" text NOT NULL,
	"source" text NOT NULL,
	"action" text NOT NULL,
	"restricted" boolean DEFAULT false NOT NULL,
	"parent_visible" boolean DEFAULT false NOT NULL,
	"excerpt_enc" text,
	"excerpt_until" timestamp with time zone,
	"escalated" boolean DEFAULT false NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safety_event_count" (
	"day" date NOT NULL,
	"category" text NOT NULL,
	"severity" integer NOT NULL,
	"feature" text NOT NULL,
	"phase" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "safety_event_count_day_category_severity_feature_phase_pk" PRIMARY KEY("day","category","severity","feature","phase")
);
--> statement-breakpoint
ALTER TABLE "safety_event" ADD CONSTRAINT "safety_event_child_id_child_profile_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_event" ADD CONSTRAINT "safety_event_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "safety_event_child_idx" ON "safety_event" USING btree ("child_id","created_at");--> statement-breakpoint
CREATE INDEX "safety_event_review_idx" ON "safety_event" USING btree ("reviewed_at","level");