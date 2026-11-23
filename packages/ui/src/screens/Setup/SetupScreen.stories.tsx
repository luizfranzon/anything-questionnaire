import type { Meta, StoryObj } from "@storybook/react-vite";
import { SetupScreen } from "./SetupScreen";

const meta = {
  title: "Telas/Acesso ao Claude",
  component: SetupScreen,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SetupScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Primeira execução: bloqueia o app, sem saída. */
export const PrimeiraExecucao: Story = {};

export const Validando: Story = { args: { validating: true } };

export const TokenInvalido: Story = {
  args: { error: "O token foi recusado, pode estar errado ou expirado. Gere outro com claude setup-token e cole de novo." },
};
export const LimiteDeUso: Story = {
  args: { error: "A assinatura atingiu o limite de uso. Tente de novo quando o limite renovar." },
};
export const SemAcessoAoModelo: Story = {
  args: { error: "Esta conta não tem acesso ao modelo usado no teste. Confira o plano ou use uma Chave de API." },
};
export const SemRede: Story = {
  args: { error: "Não foi possível falar com o Claude. Confira a conexão e tente de novo." },
};

/** Em Configurações, com uma Credencial guardada. */
export const TrocarMetodo: Story = {
  args: { mode: "settings", current: { method: "subscription", masked: "sk-ant-oat…1234", source: "stored" } },
};
export const VariavelDeAmbienteEmUso: Story = {
  args: { mode: "settings", current: { method: "api-key", masked: "sk-ant-api…9999", source: "environment" } },
};
