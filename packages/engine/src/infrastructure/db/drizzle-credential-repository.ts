import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { CredentialRepository } from "../../application/ports/credential-ports";
import { credentials } from "./schema";

const ROW_ID = "default";

export function createDrizzleCredentialRepository(db: PostgresJsDatabase): CredentialRepository {
  return {
    async find() {
      const [row] = await db.select().from(credentials).where(eq(credentials.id, ROW_ID));
      return row ? { method: row.method, secret: row.secret } : null;
    },

    async save({ method, secret }) {
      await db
        .insert(credentials)
        .values({ id: ROW_ID, method, secret })
        .onConflictDoUpdate({ target: credentials.id, set: { method, secret, updatedAt: new Date() } });
    },
  };
}
