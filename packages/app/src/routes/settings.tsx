import { useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import type { CredentialStatus, Stage } from "@anything-questionnaire/engine";
import { SettingsScreen } from "@anything-questionnaire/ui/screens/Settings/SettingsScreen.tsx";
import { GENERIC_SAVE_ERROR, messageFor } from "../presentation/error-messages";
import { getCredentialStatus } from "../server/credentials";
import { getSettings, setModelPrice, setStageModel } from "../server/settings";

export const Route = createFileRoute("/settings")({
  loader: async () => {
    const [settings, access] = await Promise.all([getSettings(), getCredentialStatus()]);
    return { settings, access };
  },
  component: SettingsRoute,
});

const ACCESS_NAME = { subscription: "Assinatura do Claude", "api-key": "Chave de API" } as const;

function describeAccess(access: CredentialStatus): string {
  if (!access.configured) return "Nenhuma Credencial configurada.";
  const origin = access.source === "environment" ? "vem de uma variável de ambiente" : "guardada neste app";
  return `${ACCESS_NAME[access.method]} (${access.masked}), ${origin}.`;
}

/** The screen names Stages and models by short ids; the engine uses its own. */
const STAGE_BY_SCREEN_ID: Record<string, Stage> = {
  topics: "topic-extraction",
  chunks: "excerpt-classification",
  generate: "question-generation",
  blind: "blind-resolution",
  contest: "contestation-judgment",
};

const MODEL_BY_SCREEN_ID: Record<string, string> = {
  fable: "claude-fable-5-2",
  opus: "claude-opus-5-5",
  sonnet: "claude-sonnet-5-5",
  haiku: "claude-haiku-5-5",
};

const SCREEN_ID_BY_MODEL = Object.fromEntries(Object.entries(MODEL_BY_SCREEN_ID).map(([id, model]) => [model, id]));
const MODEL_LABELS: Record<string, string> = {
  fable: "Fable 5.2",
  opus: "Opus 5.5",
  sonnet: "Sonnet 5.5",
  haiku: "Haiku 5.5",
};

function SettingsRoute() {
  const { settings, access } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const [stageSaving, setStageSaving] = useState<string>();
  const [stageError, setStageError] = useState<Record<string, string>>({});
  const [priceSavingId, setPriceSavingId] = useState<string>();
  const [priceErrors, setPriceErrors] = useState<Record<string, string>>({});

  const initialModels = Object.fromEntries(
    Object.entries(STAGE_BY_SCREEN_ID).map(([screenId, stage]) => [
      screenId,
      SCREEN_ID_BY_MODEL[settings.stageModels[stage]] ?? "sonnet",
    ]),
  );
  const initialPrices = Object.entries(MODEL_BY_SCREEN_ID).map(([id, model]) => ({
    id,
    model: MODEL_LABELS[id],
    ...settings.prices[model],
  }));

  return (
    <SettingsScreen
      access={{ summary: describeAccess(access), onOpen: () => navigate({ to: "/setup" }) }}
      initialModels={initialModels}
      initialPrices={initialPrices}
      stageSaving={stageSaving}
      stageError={stageError}
      priceSavingId={priceSavingId}
      priceErrors={priceErrors}
      onRetry={() => router.invalidate()}
      onStageModelChange={async (stageId, modelId) => {
        setStageSaving(stageId);
        setStageError(({ [stageId]: _cleared, ...rest }) => rest);
        try {
          const result = await setStageModel({
            data: { stage: STAGE_BY_SCREEN_ID[stageId], model: MODEL_BY_SCREEN_ID[modelId] },
          });
          if (!result.ok) setStageError((cur) => ({ ...cur, [stageId]: messageFor(result.code) }));
        } catch {
          setStageError((cur) => ({ ...cur, [stageId]: GENERIC_SAVE_ERROR }));
        } finally {
          setStageSaving(undefined);
        }
      }}
      onPriceSave={async ({ id, input, output, cacheRead, cacheWrite }) => {
        setPriceSavingId(id);
        setPriceErrors(({ [id]: _cleared, ...rest }) => rest);
        try {
          const result = await setModelPrice({
            data: { model: MODEL_BY_SCREEN_ID[id], price: { input, output, cacheRead, cacheWrite } },
          });
          if (!result.ok) setPriceErrors((cur) => ({ ...cur, [id]: messageFor(result.code) }));
        } catch {
          setPriceErrors((cur) => ({ ...cur, [id]: GENERIC_SAVE_ERROR }));
        } finally {
          setPriceSavingId(undefined);
        }
      }}
    />
  );
}
