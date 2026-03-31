CREATE TYPE "public"."group_role" AS ENUM('captain', 'manager', 'player');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('draft', 'open', 'full', 'locked', 'played', 'rated');--> statement-breakpoint
CREATE TYPE "public"."player_status" AS ENUM('confirmed', 'waitlisted', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."recurrence" AS ENUM('none', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."team" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "group_role" DEFAULT 'player' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_by" uuid NOT NULL,
	"invite_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groups_slug_unique" UNIQUE("slug"),
	CONSTRAINT "groups_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "match_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"user_id" uuid,
	"status" "player_status" DEFAULT 'confirmed' NOT NULL,
	"team" "team",
	"guest_name" text,
	"guest_token" text,
	"attended" boolean,
	"confirmed_at" timestamp DEFAULT now(),
	"cancelled_at" timestamp,
	CONSTRAINT "match_players_guest_token_unique" UNIQUE("guest_token")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid,
	"created_by" uuid NOT NULL,
	"title" text,
	"location" text NOT NULL,
	"date" timestamp NOT NULL,
	"max_players" integer NOT NULL,
	"min_players" integer DEFAULT 10 NOT NULL,
	"status" "match_status" DEFAULT 'draft' NOT NULL,
	"deadline" timestamp,
	"recurrence" "recurrence" DEFAULT 'none' NOT NULL,
	"parent_match_id" uuid,
	"match_summary" text,
	"score_team_a" integer,
	"score_team_b" integer,
	"share_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "matches_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"waitlist_promotion" boolean DEFAULT true NOT NULL,
	"deadline_reminder" boolean DEFAULT true NOT NULL,
	"post_match_rating" boolean DEFAULT true NOT NULL,
	"new_recurring_match" boolean DEFAULT true NOT NULL,
	"welcome_email" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"group_id" uuid,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"matches_confirmed" integer DEFAULT 0 NOT NULL,
	"matches_attended" integer DEFAULT 0 NOT NULL,
	"matches_no_show" integer DEFAULT 0 NOT NULL,
	"attendance_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"avg_technique" numeric(3, 2) DEFAULT '3.00' NOT NULL,
	"avg_physique" numeric(3, 2) DEFAULT '3.00' NOT NULL,
	"avg_collectif" numeric(3, 2) DEFAULT '3.00' NOT NULL,
	"avg_overall" numeric(3, 2) DEFAULT '3.00' NOT NULL,
	"total_ratings_received" integer DEFAULT 0 NOT NULL,
	"last_match_date" timestamp,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"rater_id" text NOT NULL,
	"rated_id" text NOT NULL,
	"technique" integer NOT NULL,
	"physique" integer NOT NULL,
	"collectif" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"name" text NOT NULL,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_group" ON "player_stats" USING btree ("user_id","group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_rating" ON "ratings" USING btree ("match_id","rater_id","rated_id");