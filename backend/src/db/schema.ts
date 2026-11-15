import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type StepKind = "video" | "placement" | "practice" | "final";
export type Plan = "free" | "monthly" | "annual";
export type AttemptKind = "practice" | "placement" | "trial";
export type Profile = { pronouns: string; goal: string; frequency: string; struggle: string };
export type Takeaway = { title: string; body: string };
export type Criteria = { requireStructure: boolean; minSec?: number; maxSec?: number; maxFillers?: number };
export type PartFlags = { s: boolean; t: boolean; a: boolean; r: boolean };
export type PartTexts = { s: string; t: string; a: string; r: string };
export type Scores = { overall: number; structure: number; clarity: number; pace: number; filler: number; confidence: number };
export const SKILL_KEYS = ["fluency", "pronunciation", "grammar", "vocabulary", "cohesion"] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];
export type Skills = Record<SkillKey, number>;
/** Running speaking-skill profile: moves toward each practice's skill scores. */
export type SkillProfile = { current: Skills; previous: Skills | null; practices: number; updatedAt: string };

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  structureLabels: jsonb("structure_labels").$type<string[]>().notNull(),
  durationLabel: text("duration_label"),
  sortOrder: integer("sort_order").notNull(),
});

export const steps = pgTable("steps", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  kind: text("kind").$type<StepKind>().notNull(),
  title: text("title").notNull(),
  overline: text("overline").notNull(),
  durationMin: integer("duration_min").notNull(),
  youtubeId: text("youtube_id"),
  speakerName: text("speaker_name"),
  speakerRole: text("speaker_role"),
  takeaways: jsonb("takeaways").$type<Takeaway[]>(),
  required: boolean("required").notNull().default(false),
  practiceGoal: text("practice_goal"),
  taskQuestion: text("task_question"),
  minScore: integer("min_score"),
  criteria: jsonb("criteria").$type<Criteria>(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    currentStreak: integer("current_streak").notNull().default(0),
    bestStreak: integer("best_streak").notNull().default(0),
    lastPracticeDate: date("last_practice_date"),
    plan: text("plan").$type<Plan>().notNull().default("free"),
    planRenewsAt: timestamp("plan_renews_at", { withTimezone: true }),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    trialUsedAt: timestamp("trial_used_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("users_name_lower_idx").on(sql`lower(${table.name})`)],
);

export const userContext = pgTable("user_context", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  goal: text("goal"),
  role: text("role"),
  notes: jsonb("notes").$type<string[]>().notNull().default([]),
  profile: jsonb("profile").$type<Profile>(),
  skills: jsonb("skills").$type<SkillProfile>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stepProgress = pgTable(
  "step_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull(),
    stepId: text("step_id").notNull(),
    status: text("status").$type<"done" | "skipped">().notNull(),
    bestScore: integer("best_score"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.courseId, table.stepId] })],
);

export const practiceSessions = pgTable("practice_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull(),
  stepId: text("step_id").notNull(),
  passed: boolean("passed").notNull(),
  overall: integer("overall").notNull(),
  scores: jsonb("scores").$type<Scores>().notNull(),
  star: jsonb("star").$type<PartFlags>().notNull(),
  tips: jsonb("tips").$type<string[]>().notNull(),
  improvedAnswer: jsonb("improved_answer").$type<PartTexts>().notNull(),
  skills: jsonb("skills").$type<Skills>(),
  coachLine: text("coach_line"),
  transcript: text("transcript").notNull(),
  fillerCount: integer("filler_count").notNull(),
  wpm: integer("wpm").notNull(),
  durationSec: integer("duration_sec").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const voiceAttempts = pgTable("voice_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").$type<AttemptKind>().notNull().default("practice"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Course = typeof courses.$inferSelect;
export type Step = typeof steps.$inferSelect;
export type User = typeof users.$inferSelect;
export type PracticeSession = typeof practiceSessions.$inferSelect;
