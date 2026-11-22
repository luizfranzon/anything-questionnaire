import postgres from "postgres";
import { randomUUID } from "node:crypto";
import { createEngine, createFakeClaudeGateway, runMigrations } from "../src/index";

const ADMIN_URL =
  process.env.TEST_ADMIN_DATABASE_URL ?? "postgres://questionnaire:questionnaire@localhost:5432/postgres";

/** Creates a throwaway database, migrates it and returns an engine with fake adapters plus a cleanup function. */
export async function createTestEngine() {
  const name = `test_${randomUUID().replace(/-/g, "")}`;
  const admin = postgres(ADMIN_URL, { max: 1 });
  await admin.unsafe(`CREATE DATABASE ${name}`);
  const url = new URL(ADMIN_URL);
  url.pathname = `/${name}`;
  await runMigrations(url.toString());

  const claude = createFakeClaudeGateway();
  let now = new Date("2026-01-01T00:00:00Z");
  const clock = { now: () => now, set: (date: Date) => void (now = date) };

  const engine = await createEngine({
    databaseUrl: url.toString(),
    claude: claude.gateway,
    clock,
    // Jobs are run by drainJobs(), not by background polling; retries have no delay.
    queue: { retryDelaySeconds: 0, pollingIntervalSeconds: 600 },
  });
  return {
    engine,
    claude,
    clock,
    async cleanup() {
      await engine.close();
      await admin.unsafe(`DROP DATABASE ${name} WITH (FORCE)`);
      await admin.end();
    },
  };
}
