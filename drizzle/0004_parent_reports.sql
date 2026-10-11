CREATE TABLE "parent_report" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"child_id" text,
	"category" text NOT NULL,
	"note_enc" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "safety_event" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "parent_report" ADD CONSTRAINT "parent_report_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_report" ADD CONSTRAINT "parent_report_child_id_child_profile_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parent_report_review_idx" ON "parent_report" USING btree ("reviewed_at");