import { createServerFn } from "@tanstack/react-start";
import {
  DomainError,
  type AccessMethod,
  type CredentialStatus,
  type DomainErrorCode,
} from "@anything-questionnaire/engine";
import { getEngine } from "./engine";

export type Result<T> = { ok: true; data: T } | { ok: false; code: DomainErrorCode };

/** Only the status travels to the browser: the engine never hands the secret back, just a masked form of it. */
export const getCredentialStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<CredentialStatus> => (await getEngine()).getCredentialStatus(),
);

export const saveCredential = createServerFn({ method: "POST" })
  .validator((input: { method: AccessMethod; secret: string }) => input)
  .handler(async ({ data }): Promise<Result<CredentialStatus>> => {
    try {
      return { ok: true, data: await (await getEngine()).saveCredential(data) };
    } catch (error) {
      if (error instanceof DomainError) return { ok: false, code: error.code };
      throw error;
    }
  });
