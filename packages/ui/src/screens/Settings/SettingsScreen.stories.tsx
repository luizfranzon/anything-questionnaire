import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsScreen } from "./SettingsScreen";

const meta = {
  title: "Telas/Configurações",
  component: SettingsScreen,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Padrão: tudo em Sonnet 5.5 e nos valores padrão do motor. */
export const Padrao: Story = {};

export const ValoresAlterados: Story = {
  args: {
    initialModels: { generate: "sonnet", chunks: "haiku", topics: "opus", blind: "opus", contest: "fable" },
    initialParams: { window: 20, minWeight: 5, reviewFraction: 40, existingLimit: 80, similarity: 85 },
  },
};
export const ParametrosForaDaFaixa: Story = {
  args: { initialParams: { window: 0, minWeight: 80, reviewFraction: null, existingLimit: 500, similarity: 20 }, showRangeErrors: true },
};
export const GravandoModelo: Story = { args: { initialModels: { generate: "sonnet" }, stageSaving: "generate" } };
export const ErroAoGravarModelo: Story = {
  args: {
    initialModels: { generate: "sonnet" },
    stageError: { generate: "Não foi possível gravar. Escolha o modelo de novo." },
  },
};
export const GravandoPreco: Story = { args: { priceSavingId: "sonnet" } };
export const ErroAoGravarPreco: Story = {
  args: { priceErrors: { sonnet: "Não foi possível gravar os preços do Sonnet 5.5. Confira os valores e tente de novo." } },
};
export const GravandoParametro: Story = { args: { initialParams: { window: 20 }, paramSavingId: "window" } };
export const ErroAoGravarParametro: Story = {
  args: {
    initialParams: { window: 20 },
    paramErrors: { window: "Não foi possível gravar. Tente de novo." },
  },
};
export const Carregando: Story = { args: { status: "loading" } };
export const NaoCarregou: Story = { args: { status: "error" } };
