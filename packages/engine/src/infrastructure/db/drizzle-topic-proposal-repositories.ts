import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type {
  ProposalRepository,
  StoredProposal,
  TopicRepository,
  UsageRepository,
} from "../../application/ports/topic-proposal-ports";
import type { Stage } from "../../domain/usage";
import { topicProposals, topics, usageRecords } from "./schema";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toStored = (row: typeof topicProposals.$inferSelect): StoredProposal => ({
  id: row.id,
  studyId: row.studyId,
  jobId: row.jobId,
  topics: row.topics,
});

const toTopic = ({ id, studyId, name }: typeof topics.$inferSelect) => ({ id, studyId, name });

export function createDrizzleProposalRepository(db: PostgresJsDatabase): ProposalRepository {
  return {
    async insert(studyId) {
      const [row] = await db.insert(topicProposals).values({ studyId }).returning();
      return toStored(row);
    },

    async findByStudy(studyId) {
      if (!UUID_PATTERN.test(studyId)) return null;
      const [row] = await db.select().from(topicProposals).where(eq(topicProposals.studyId, studyId));
      return row ? toStored(row) : null;
    },

    async findById(id) {
      if (!UUID_PATTERN.test(id)) return null;
      const [row] = await db.select().from(topicProposals).where(eq(topicProposals.id, id));
      return row ? toStored(row) : null;
    },

    async setJobId(id, jobId) {
      await db.update(topicProposals).set({ jobId }).where(eq(topicProposals.id, id));
    },

    async setTopics(id, names) {
      await db.update(topicProposals).set({ topics: names }).where(eq(topicProposals.id, id));
    },

    async delete(id) {
      await db.delete(topicProposals).where(eq(topicProposals.id, id));
    },

    approve(proposal, names) {
      return db.transaction(async (tx) => {
        const [{ next }] = await tx
          .select({ next: sql<number>`coalesce(max(${topics.position}), -1) + 1` })
          .from(topics)
          .where(eq(topics.studyId, proposal.studyId));
        const rows = await tx
          .insert(topics)
          .values(names.map((name, i) => ({ studyId: proposal.studyId, name, position: Number(next) + i })))
          .onConflictDoNothing()
          .returning();
        await tx.delete(topicProposals).where(eq(topicProposals.id, proposal.id));
        return rows.sort((a, b) => a.position - b.position).map(toTopic);
      });
    },
  };
}

export function createDrizzleTopicRepository(db: PostgresJsDatabase): TopicRepository {
  return {
    async findActiveByStudy(studyId) {
      if (!UUID_PATTERN.test(studyId)) return [];
      const rows = await db
        .select()
        .from(topics)
        .where(and(eq(topics.studyId, studyId), eq(topics.status, "active")))
        .orderBy(asc(topics.position));
      return rows.map(toTopic);
    },
  };
}

export function createDrizzleUsageRepository(db: PostgresJsDatabase): UsageRepository {
  return {
    async insert(record) {
      await db.insert(usageRecords).values(record);
    },

    async find({ studyId, stage, from, to }) {
      if (studyId && !UUID_PATTERN.test(studyId)) return [];
      const rows = await db
        .select()
        .from(usageRecords)
        .where(
          and(
            studyId ? eq(usageRecords.studyId, studyId) : undefined,
            stage ? eq(usageRecords.stage, stage) : undefined,
            from ? gte(usageRecords.createdAt, from) : undefined,
            to ? lte(usageRecords.createdAt, to) : undefined,
          ),
        )
        .orderBy(asc(usageRecords.createdAt));
      return rows.map(({ id: _id, stage, ...rest }) => ({ ...rest, stage: stage as Stage }));
    },
  };
}
