ALTER TABLE "child_profile" ADD COLUMN "avatar" jsonb;--> statement-breakpoint
ALTER TABLE "child_profile" ADD COLUMN "nickname_key" text;--> statement-breakpoint
ALTER TABLE "child_profile" ADD COLUMN "interests" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "child_profile" ADD COLUMN "onboarding" jsonb DEFAULT '{"step":0}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "child_settings" ADD COLUMN "sound" boolean DEFAULT true NOT NULL;