import type { AccessMethod } from "../../domain/credential";

/** Encrypts secrets before they reach the database. */
export interface SecretCipher {
  encrypt(plain: string): string;
  /** Throws when the data was tampered with or encrypted under another key. */
  decrypt(stored: string): string;
}

export interface StoredCredential {
  method: AccessMethod;
  /** Encrypted. */
  secret: string;
}

/** The one Credential the user saved in the wizard. */
export interface CredentialRepository {
  find(): Promise<StoredCredential | null>;
  /** Replaces whatever was stored. */
  save(credential: StoredCredential): Promise<void>;
}
