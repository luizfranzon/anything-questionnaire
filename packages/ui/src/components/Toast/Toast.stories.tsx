import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button/Button";
import type { AlertTone } from "../InlineAlert/InlineAlert";
import { Toast, ToastProvider, useToast } from "./Toast";

const meta = {
  title: "Componentes/Toast",
  component: Toast,
  args: { title: "Fonte adicionada" },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Toast>;
export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const { toast } = useToast();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <Button
        variant="secondary"
        onClick={() => toast({ tone: "success", title: "Fonte adicionada", description: "apostila-redes.pdf está sendo processada." })}
      >
        Sucesso (some em 6s)
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            tone: "warn",
            title: "Este PDF parece escaneado",
            description: "O texto pode ter erros de leitura.",
          })
        }
      >
        Aviso
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            tone: "danger",
            title: "Falhou ao baixar o site",
            description: "O endereço não respondeu.",
            action: { label: "Tentar de novo", onClick: () => {} },
          })
        }
      >
        Erro (fica até fechar)
      </Button>
      <Button variant="secondary" onClick={() => toast({ title: "Estudo duplicado" })}>
        Informação, só título
      </Button>
    </div>
  );
}

/** Pelo canto inferior direito da janela. Mouse ou foco em cima pausam o tempo; passando de 3, o mais antigo sai. */
export const Fila: Story = { render: () => <Demo /> };

const tones: AlertTone[] = ["info", "success", "warn", "danger"];
const sample: Record<AlertTone, { title: string; description: string }> = {
  info: { title: "Estudo duplicado", description: "A cópia não leva as Respostas." },
  success: { title: "Fonte adicionada", description: "12 Tópicos propostos." },
  warn: { title: "PDF escaneado", description: "O texto pode ter erros de leitura." },
  danger: { title: "Falhou ao baixar o site", description: "O endereço não respondeu." },
};

/** Cada tom: só título, com descrição, com ação. */
export const MatrizDeVariantes: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: 24, padding: 32, justifyContent: "start" }}>
      {tones.map((tone) => (
        <div key={tone} style={{ display: "contents" }}>
          <Toast tone={tone} title={sample[tone].title} onDismiss={() => {}} />
          <Toast tone={tone} title={sample[tone].title} description={sample[tone].description} onDismiss={() => {}} />
          <Toast
            tone={tone}
            title={sample[tone].title}
            description={sample[tone].description}
            action={{ label: "Ver Fonte", onClick: () => {} }}
            onDismiss={() => {}}
          />
        </div>
      ))}
    </div>
  ),
};
