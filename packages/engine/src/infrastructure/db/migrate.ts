import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { fileURLToPath } from "node:url";

const defaultMigrationsFolder = fileURLToPath(new URL("../../../drizzle", import.meta.url));

/** Applies all pending versioned migrations. `MIGRATIONS_DIR` overrides the folder (needed once the code is bundled). */
export async function runMigrations(databaseUrl: string): Promise<void> {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: process.env.MIGRATIONS_DIR ?? defaultMigrationsFolder });
  } finally {
    await client.end();
  }
}
