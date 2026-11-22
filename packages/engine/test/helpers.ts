import postgres from "postgres";
import { randomUUID } from "node:crypto";
import { createEngine, runMigrations } from "../src/index";

const ADMIN_URL =
  process.env.TEST_ADMIN_DATABASE_URL ?? "postgres://questionnaire:questionnaire@localhost:5432/postgres";

/** Creates a throwaway database, migrates it and returns an engine plus a cleanup function. */
export async function createTestEngine() {
  const name = `test_${randomUUID().replace(/-/g, "")}`;
  const admin = postgres(ADMIN_URL, { max: 1 });
  await admin.unsafe(`CREATE DATABASE ${name}`);
  const url = new URL(ADMIN_URL);
  url.pathname = `/${name}`;
  await runMigrations(url.toString());
  const engine = createEngine({ databaseUrl: url.toString() });
  return {
    engine,
    async cleanup() {
      await engine.close();
      await admin.unsafe(`DROP DATABASE ${name} WITH (FORCE)`);
      await admin.end();
    },
  };
}
