import { desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { StudyRepository } from "../../application/ports/study-repository";
import { studies } from "./schema";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createDrizzleStudyRepository(db: PostgresJsDatabase): StudyRepository {
  return {
    async insert(details) {
      const [row] = await db.insert(studies).values(details).returning();
      return row;
    },

    findAll() {
      return db.select().from(studies).orderBy(desc(studies.createdAt));
    },

    async findById(id) {
      if (!UUID_PATTERN.test(id)) return null;
      const [row] = await db.select().from(studies).where(eq(studies.id, id));
      return row ?? null;
    },

    async update(id, details) {
      if (!UUID_PATTERN.test(id)) return null;
      const [row] = await db
        .update(studies)
        .set({ ...details, updatedAt: new Date() })
        .where(eq(studies.id, id))
        .returning();
      return row ?? null;
    },

    async delete(id) {
      if (!UUID_PATTERN.test(id)) return;
      await db.delete(studies).where(eq(studies.id, id));
    },
  };
}
