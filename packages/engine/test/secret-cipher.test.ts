import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFileKeyCipher } from "../src/infrastructure/crypto/file-key-cipher";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "aq-cipher-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const SECRET = "sk-ant-oat01-abcdefghijklmnopqrstuvwxyz-1234";

describe("Secret cipher", () => {
  it("round-trips a secret without leaving it readable in what it stores", async () => {
    const cipher = await createFileKeyCipher(dir);
    const stored = cipher.encrypt(SECRET);

    expect(stored).not.toContain("abcdefghijklmnopqrstuvwxyz");
    expect(cipher.decrypt(stored)).toBe(SECRET);
  });

  it("generates the master key on first use and keeps it, so a restart can still decrypt", async () => {
    const stored = (await createFileKeyCipher(dir)).encrypt(SECRET);

    const afterRestart = await createFileKeyCipher(dir);
    expect(afterRestart.decrypt(stored)).toBe(SECRET);
  });

  it("encrypts the same secret differently each time", async () => {
    const cipher = await createFileKeyCipher(dir);
    expect(cipher.encrypt(SECRET)).not.toBe(cipher.encrypt(SECRET));
  });

  it("refuses data that was tampered with or encrypted under another key", async () => {
    const cipher = await createFileKeyCipher(dir);
    const stored = cipher.encrypt(SECRET);
    const tampered = stored.slice(0, -2) + (stored.endsWith("AA") ? "BB" : "AA");
    expect(() => cipher.decrypt(tampered)).toThrow();

    const otherDir = await mkdtemp(join(tmpdir(), "aq-cipher-"));
    try {
      const other = await createFileKeyCipher(otherDir);
      expect(() => other.decrypt(stored)).toThrow();
    } finally {
      await rm(otherDir, { recursive: true, force: true });
    }
  });
});
