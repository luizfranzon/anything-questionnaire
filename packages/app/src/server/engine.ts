import { createEngine, runMigrations, type Engine } from "@anything-questionnaire/engine";

let instance: Promise<Engine> | undefined;

/** Composition root of the server: migrates on first use, then reuses a single engine. */
export function getEngine(): Promise<Engine> {
  instance ??= (async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is not set. See .env.example.");
    await runMigrations(databaseUrl);
    return createEngine({ databaseUrl, anthropicApiKey: process.env.ANTHROPIC_API_KEY });
  })().catch((error) => {
    instance = undefined; // do not cache a failed start-up; the next call retries
    throw error;
  });
  return instance;
}
