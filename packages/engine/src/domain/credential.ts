import { DomainError } from "./errors";

/** How the app reaches Claude: the user's subscription (Agent SDK) or an API key (Messages API). ADR 0004. */
export type AccessMethod = "subscription" | "api-key";

export const ACCESS_METHODS: readonly AccessMethod[] = ["subscription", "api-key"];

/** What the user pasted in the wizard, or what an environment variable carries. */
export interface Credential {
  method: AccessMethod;
  secret: string;
}

/** Where the Credential in use comes from. The environment variable wins over the stored one. */
export type CredentialSource = "environment" | "stored";

export type CredentialStatus =
  | { configured: false }
  /** `masked` is all the interface ever gets of the secret. */
  | { configured: true; method: AccessMethod; masked: string; source: CredentialSource };

/** Keeps the start and the last four characters, so the user can tell which token is in use. */
export function maskSecret(secret: string): string {
  const visibleEnd = secret.slice(-4);
  const prefix = secret.match(/^[a-z]+-[a-z]+(?:\d+)?-/i)?.[0] ?? "";
  return `${prefix}…${visibleEnd}`;
}

export function validateCredentialInput(input: { method: AccessMethod; secret: string }): Credential {
  if (!ACCESS_METHODS.includes(input.method)) throw new DomainError("ACCESS_METHOD_INVALID");
  const secret = typeof input.secret === "string" ? input.secret.trim() : "";
  if (!secret) throw new DomainError("CREDENTIAL_SECRET_REQUIRED");
  return { method: input.method, secret };
}
