import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============ ENUMS ============

export const matchStatusEnum = pgEnum("match_status", [
  "draft",
  "open",
  "full",
  "locked",
  "played",
  "rated",
]);

export const playerStatusEnum = pgEnum("player_status", [
  "confirmed",
  "waitlisted",
  "cancelled",
  "no_show",
]);

export const teamEnum = pgEnum("team", ["A", "B"]);

export const recurrenceEnum = pgEnum("recurrence", ["none", "weekly"]);

export const groupRoleEnum = pgEnum("group_role", ["captain", "manager", "player"]);

// ============ BETTER-AUTH TABLES ============

// User table - better-auth requires text id, not uuid
// better-auth will handle ID generation
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session table for better-auth
export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").unique().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Account table for better-auth (stores OAuth and email/password data)
// better-auth uses accountId as the primary key (not a separate id field)
export const accounts = pgTable("account", {
  accountId: text("account_id").primaryKey(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"), // For email/password auth
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============ APPLICATION TABLES ============

export const notificationPreferences = pgTable("notification_preferences", {
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .primaryKey(),
  waitlistPromotion: boolean("waitlist_promotion").notNull().default(true),
  deadlineReminder: boolean("deadline_reminder").notNull().default(true),
  postMatchRating: boolean("post_match_rating").notNull().default(true),
  newRecurringMatch: boolean("new_recurring_match").notNull().default(true),
  welcomeEmail: boolean("welcome_email").notNull().default(true),
});

export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  inviteCode: text("invite_code").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: text("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: groupRoleEnum("role").notNull().default("player"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.userId] }),
  })
);

export const matches = pgTable("matches", {
  id: text("id").primaryKey(),
  groupId: text("group_id").references(() => groups.id, { onDelete: "set null" }),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  title: text("title"),
  location: text("location").notNull(),
  date: timestamp("date").notNull(),
  maxPlayers: integer("max_players").notNull(),
  minPlayers: integer("min_players").notNull().default(10),
  status: matchStatusEnum("status").notNull().default("draft"),
  deadline: timestamp("deadline"),
  recurrence: recurrenceEnum("recurrence").notNull().default("none"),
  parentMatchId: text("parent_match_id"),
  matchSummary: text("match_summary"),
  scoreTeamA: integer("score_team_a"),
  scoreTeamB: integer("score_team_b"),
  shareToken: text("share_token").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const matchPlayers = pgTable("match_players", {
  id: text("id").primaryKey(),
  matchId: text("match_id")
    .references(() => matches.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  status: playerStatusEnum("status").notNull().default("confirmed"),
  team: teamEnum("team"),
  guestName: text("guest_name"),
  guestToken: text("guest_token").unique(),
  attended: boolean("attended"),
  confirmedAt: timestamp("confirmed_at").defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
});

export const ratings = pgTable(
  "ratings",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id")
      .references(() => matches.id, { onDelete: "cascade" })
      .notNull(),
    raterId: text("rater_id").notNull(),
    ratedId: text("rated_id").notNull(),
    technique: integer("technique").notNull(),
    physique: integer("physique").notNull(),
    collectif: integer("collectif").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueRating: uniqueIndex("unique_rating").on(
      table.matchId,
      table.raterId,
      table.ratedId
    ),
  })
);

export const playerStats = pgTable(
  "player_stats",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    groupId: text("group_id").references(() => groups.id, { onDelete: "cascade" }),
    matchesPlayed: integer("matches_played").notNull().default(0),
    matchesConfirmed: integer("matches_confirmed").notNull().default(0),
    matchesAttended: integer("matches_attended").notNull().default(0),
    matchesNoShow: integer("matches_no_show").notNull().default(0),
    attendanceRate: decimal("attendance_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    avgTechnique: decimal("avg_technique", { precision: 3, scale: 2 })
      .notNull()
      .default("3.00"),
    avgPhysique: decimal("avg_physique", { precision: 3, scale: 2 })
      .notNull()
      .default("3.00"),
    avgCollectif: decimal("avg_collectif", { precision: 3, scale: 2 })
      .notNull()
      .default("3.00"),
    avgOverall: decimal("avg_overall", { precision: 3, scale: 2 })
      .notNull()
      .default("3.00"),
    totalRatingsReceived: integer("total_ratings_received").notNull().default(0),
    lastMatchDate: timestamp("last_match_date"),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserGroup: uniqueIndex("unique_user_group").on(table.userId, table.groupId),
  })
);

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ many, one }) => ({
  groupsCreated: many(groups),
  groupMemberships: many(groupMembers),
  matchesCreated: many(matches),
  matchParticipations: many(matchPlayers),
  stats: many(playerStats),
  notificationPreferences: one(notificationPreferences),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
  }),
  members: many(groupMembers),
  matches: many(matches),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  group: one(groups, {
    fields: [matches.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [matches.createdBy],
    references: [users.id],
  }),
  parentMatch: one(matches, {
    fields: [matches.parentMatchId],
    references: [matches.id],
  }),
  players: many(matchPlayers),
  ratings: many(ratings),
}));

export const matchPlayersRelations = relations(matchPlayers, ({ one }) => ({
  match: one(matches, {
    fields: [matchPlayers.matchId],
    references: [matches.id],
  }),
  user: one(users, {
    fields: [matchPlayers.userId],
    references: [users.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  match: one(matches, {
    fields: [ratings.matchId],
    references: [matches.id],
  }),
}));

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
  user: one(users, {
    fields: [playerStats.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [playerStats.groupId],
    references: [groups.id],
  }),
}));

// ============ TYPE EXPORTS ============

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type MatchPlayer = typeof matchPlayers.$inferSelect;
export type NewMatchPlayer = typeof matchPlayers.$inferInsert;
export type Rating = typeof ratings.$inferSelect;
export type NewRating = typeof ratings.$inferInsert;
export type PlayerStats = typeof playerStats.$inferSelect;
export type NewPlayerStats = typeof playerStats.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;
