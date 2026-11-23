import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SecretCipher } from "../../application/ports/credential-ports";

const KEY_FILE = ".master-key";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

async function loadOrCreateKey(dir: string): Promise<Buffer> {
  const path = join(dir, KEY_FILE);
  try {
    const key = Buffer.from((await readFile(path, "utf8")).trim(), "hex");
    if (key.length !== KEY_BYTES) throw new Error(`The master key at ${path} is not ${KEY_BYTES} bytes.`);
    return key;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await mkdir(dir, { recursive: true });
  const key = randomBytes(KEY_BYTES);
  try {
    // `wx` fails if another process created it first, so two starts never end up with different keys.
    await writeFile(path, key.toString("hex"), { flag: "wx", mode: 0o600 });
    return key;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    return loadOrCreateKey(dir);
  }
}

/**
 * AES-256-GCM with a master key generated on first use and kept in a file of the files volume, away from the
 * database, so a copy of the database alone does not expose the Credential.
 */
export async function createFileKeyCipher(dir: string): Promise<SecretCipher> {
  const key = await loadOrCreateKey(dir);
  return {
    encrypt(plain) {
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
    },

    decrypt(stored) {
      const raw = Buffer.from(stored, "base64");
      if (raw.length < IV_BYTES + TAG_BYTES) throw new Error("The stored secret is malformed.");
      const decipher = createDecipheriv("aes-256-gcm", key, raw.subarray(0, IV_BYTES));
      decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
      return Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString("utf8");
    },
  };
}
