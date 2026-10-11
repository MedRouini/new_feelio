CREATE TABLE "voice_session" (
	"id" text PRIMARY KEY NOT NULL,
	"child_id" text NOT NULL,
	"household_id" text NOT NULL,
	"conversation_id" text NOT NULL,
	"age_band" "age_band" NOT NULL,
	"locale" "locale" NOT NULL,
	"place_id" text,
	"allowed_seconds" integer NOT NULL,
	"adult_test" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "voice_session" ADD CONSTRAINT "voice_session_child_id_child_profile_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "voice_session_conversation_idx" ON "voice_session" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "voice_session_child_idx" ON "voice_session" USING btree ("child_id","started_at");