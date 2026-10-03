CREATE TYPE "public"."ai_interaction_status" AS ENUM('ok', 'invalid_output', 'error');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TABLE "ai_interactions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_interactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"business_id" uuid NOT NULL,
	"session_id" uuid,
	"model" text NOT NULL,
	"status" "ai_interaction_status" NOT NULL,
	"request" jsonb NOT NULL,
	"response" jsonb,
	"error" text,
	"latency_ms" integer NOT NULL,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"chat_session_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'confirmed' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "appointments_time_range_check" CHECK ("appointments"."ends_at" > "appointments"."starts_at"),
	CONSTRAINT "appointments_cancelled_at_check" CHECK (("appointments"."status" = 'cancelled') = ("appointments"."cancelled_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"timezone" text NOT NULL,
	"opens_at" time NOT NULL,
	"closes_at" time NOT NULL,
	"working_days" smallint[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug"),
	CONSTRAINT "businesses_hours_check" CHECK ("businesses"."opens_at" < "businesses"."closes_at"),
	CONSTRAINT "businesses_working_days_check" CHECK ("businesses"."working_days" <@ '{1,2,3,4,5,6,7}')
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"mentions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attachment" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"draft" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"stalled_turns" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_sessions_id_user_key" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_business_name_key" UNIQUE("business_id","name"),
	CONSTRAINT "services_duration_check" CHECK ("services"."duration_minutes" between 5 and 480)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"email" "citext" NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_business_email_key" UNIQUE("business_id","email")
);
--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_chat_session_owner_fkey" FOREIGN KEY ("chat_session_id","user_id") REFERENCES "public"."chat_sessions"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_interactions_session_idx" ON "ai_interactions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ai_interactions_created_at_idx" ON "ai_interactions" USING brin ("created_at");--> statement-breakpoint
CREATE INDEX "appointments_user_starts_at_idx" ON "appointments" USING btree ("user_id","starts_at");--> statement-breakpoint
CREATE INDEX "chat_messages_session_created_idx" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_sessions_user_recent_idx" ON "chat_sessions" USING btree ("user_id","last_message_at" DESC NULLS LAST);