import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createStudyUseCases } from "./application/use-cases/study-use-cases";
import { createDrizzleStudyRepository } from "./infrastructure/db/drizzle-study-repository";

export { runMigrations } from "./infrastructure/db/migrate";
export { DomainError, type DomainErrorCode } from "./domain/errors";
export {
  STUDY_GOAL_MAX_LENGTH,
  STUDY_NAME_MAX_LENGTH,
  type Study,
  type StudyDetails,
} from "./domain/study";

/** Composition root: wires infrastructure adapters into the application use cases. */
export function createEngine({ databaseUrl }: { databaseUrl: string }) {
  const client = postgres(databaseUrl);
  const studies = createDrizzleStudyRepository(drizzle(client));

  return {
    ...createStudyUseCases(studies),
    async close(): Promise<void> {
      await client.end();
    },
  };
}

export type Engine = ReturnType<typeof createEngine>;
