import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button/Button";
import { InlineAlert, type AlertTone } from "./InlineAlert";

const meta = {
  title: "Componentes/InlineAlert",
  component: InlineAlert,
  args: { tone: "info", children: "A Fonte será processada em segundo plano. Você pode sair desta página." },
  argTypes: { tone: { control: "inline-radio", options: ["info", "success", "warn", "danger"] } },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--width-reading)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InlineAlert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Informacao: Story = {};
export const Sucesso: Story = { args: { tone: "success", children: "Fonte adicionada ao Estudo." } };
export const Aviso: Story = {
  args: {
    tone: "warn",
    title: "Este PDF parece escaneado",
    children: "O texto foi extraído por reconhecimento de imagem e pode ter erros.",
  },
};
export const Erro: Story = {
  args: {
    tone: "danger",
    title: "Não foi possível baixar o site",
    children: "O endereço não respondeu. Confira a URL e tente de novo.",
    action: <Button variant="link">Tentar de novo</Button>,
  },
};
export const ComFechar: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return open ? (
      <InlineAlert {...args} onDismiss={() => setOpen(false)} />
    ) : (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Mostrar aviso de novo
      </Button>
    );
  },
};

const tones: AlertTone[] = ["info", "success", "warn", "danger"];
const samples: Record<AlertTone, { title: string; text: string }> = {
  info: { title: "Fonte em processamento", text: "Pode levar alguns minutos para PDFs longos." },
  success: { title: "Fonte pronta", text: "12 Tópicos propostos a partir do conteúdo." },
  warn: { title: "Este PDF parece escaneado", text: "O texto pode ter erros de leitura." },
  danger: { title: "Falhou ao extrair o texto", text: "O arquivo está protegido por senha." },
};

/** Cada tom com título, só texto, com ação e com X. Sempre ícone: cor nunca é o único sinal. */
export const MatrizDeVariantes: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 440px)", gap: 24, padding: 32 }}>
      {tones.map((tone) => (
        <div key={tone} style={{ display: "contents" }}>
          <InlineAlert tone={tone} title={samples[tone].title} onDismiss={() => {}}>
            {samples[tone].text}
          </InlineAlert>
          <InlineAlert tone={tone} action={<Button variant="link">Ver detalhes</Button>}>
            {samples[tone].text}
          </InlineAlert>
        </div>
      ))}
    </div>
  ),
};
