import { sql } from "drizzle-orm";
import type { Alternative } from "../../domain/question";
import type { Difficulty } from "../../domain/performance";
import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const studies = pgTable("studies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  goal: text("goal").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const topics = pgTable(
  "topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studyId: uuid("study_id")
      .notNull()
      .references(() => studies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: text("status", { enum: ["active", "archived"] }).notNull().default("active"),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("topics_study_name_unique").on(t.studyId, sql`lower(${t.name})`)],
);

/** At most one open (not yet approved) proposal per Study. `topics` is null until Claude answers. */
export const topicProposals = pgTable("topic_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  studyId: uuid("study_id")
    .notNull()
    .unique()
    .references(() => studies.id, { onDelete: "cascade" }),
  jobId: text("job_id"),
  topics: jsonb("topics").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rounds = pgTable("rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  studyId: uuid("study_id")
    .notNull()
    .references(() => studies.id, { onDelete: "cascade" }),
  mode: text("mode", { enum: ["study", "mock"] }).notNull(),
  count: integer("count").notNull(),
  /** The Topics the Round was restricted to; null means every active Topic. */
  topicIds: jsonb("topic_ids").$type<string[]>(),
  /** How many Questions each Topic gets and at which Dificuldade, drawn once when the Round is created. Null on old Rounds. */
  plan: jsonb("plan").$type<Array<{ topicId: string; count: number; difficulty: Difficulty }>>(),
  /** `generating` until the requested count of Questions exists. */
  status: text("status", { enum: ["generating", "ready"] }).notNull().default("generating"),
  jobId: text("job_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studyId: uuid("study_id")
    .notNull()
    .references(() => studies.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  format: text("format", { enum: ["multiple-choice", "open"] }).notNull(),
  prompt: text("prompt").notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("medium"),
  /** Empty for open questions. */
  alternatives: jsonb("alternatives").$type<Alternative[]>().notNull(),
  /** The correct Alternative's id (multiple choice) or the expected answer (open). */
  answerKey: text("answer_key").notNull(),
  /** Only active Questions enter Rounds and Revisões. Voiding and archiving arrive in later tickets. */
  status: text("status", { enum: ["active", "voided", "archived"] }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** FSRS state of a Question that has been answered at least once. `due` is denormalised for querying. */
export const questionReviews = pgTable(
  "question_reviews",
  {
    questionId: uuid("question_id")
      .primaryKey()
      .references(() => questions.id, { onDelete: "cascade" }),
    due: timestamp("due", { withTimezone: true }).notNull(),
    card: jsonb("card").$type<Record<string, unknown>>().notNull(),
  },
  (t) => [index("question_reviews_due_idx").on(t.due)],
);

/** The Questions presented in a Round, in order. `position` is provisional until the Round is ready. */
export const roundQuestions = pgTable(
  "round_questions",
  {
    roundId: uuid("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    /** A Revisão: an already answered Question that came back, as opposed to one generated for the Round. */
    review: boolean("review").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.roundId, t.questionId] })],
);

export const answers = pgTable(
  "answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    /** An Alternative id, free text for open questions, or null for "Não sei". */
    response: text("response"),
    outcome: text("outcome", { enum: ["correct", "partial", "incorrect"] }).notNull(),
    confidence: text("confidence", { enum: ["sure", "doubt"] }),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("answers_round_question_unique").on(t.roundId, t.questionId)],
);

/** One row per Claude call. Kept when the Study is deleted, since the spend happened. */
export const usageRecords = pgTable("usage_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  stage: text("stage").notNull(),
  model: text("model").notNull(),
  studyId: uuid("study_id").references(() => studies.id, { onDelete: "set null" }),
  roundId: uuid("round_id").references(() => rounds.id, { onDelete: "set null" }),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  cacheReadTokens: integer("cache_read_tokens").notNull(),
  cacheWriteTokens: integer("cache_write_tokens").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
