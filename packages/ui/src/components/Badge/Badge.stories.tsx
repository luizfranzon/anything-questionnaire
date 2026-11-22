import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info } from "lucide-react";
import { Badge, StatusTag, statusSpecs, type BadgeTone, type Status } from "./Badge";

const meta = {
  title: "Componentes/Badge",
  component: Badge,
  args: { children: "Rascunho" },
  argTypes: { tone: { control: "inline-radio", options: ["neutral", "info", "success", "danger", "warn"] } },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Neutro: Story = {};
export const ComIcone: Story = { args: { tone: "info", icon: <Info size={14} strokeWidth={2.5} />, children: "Novo" } };
export const Carregando: Story = { args: { tone: "info", loading: true, children: "Processando" } };

const tones: BadgeTone[] = ["neutral", "info", "success", "danger", "warn"];

const label: React.CSSProperties = { font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" };

/** Os cinco tons, sem ícone e com ícone. */
export const Tons: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "120px auto auto", gap: "16px 32px", padding: 32 }}>
      <span />
      <span style={label}>Sem ícone</span>
      <span style={label}>Com ícone</span>
      {tones.map((t) => (
        <div key={t} style={{ display: "contents" }}>
          <span style={label}>{t}</span>
          <span>
            <Badge tone={t}>Rótulo</Badge>
          </span>
          <span>
            <Badge tone={t} icon={<Info size={14} strokeWidth={2.5} />}>
              Rótulo
            </Badge>
          </span>
        </div>
      ))}
    </div>
  ),
};

const groups: { title: string; items: Status[] }[] = [
  { title: "Fonte (tickets 11 a 14)", items: ["processing", "ready", "failed"] },
  { title: "Pergunta (ticket 10)", items: ["active", "contested", "voided", "archived"] },
  { title: "Contestação (ticket 17)", items: ["reviewing", "kept", "corrected", "voided"] },
];

/** Cada situação sempre com o mesmo tom, ícone e texto. */
export const Situacoes: Story = {
  name: "StatusTag: situações",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 32 }}>
      {groups.map((g) => (
        <div key={g.title}>
          <p style={{ ...label, margin: "0 0 8px" }}>{g.title}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {g.items.map((s) => (
              <StatusTag key={s} status={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const RotuloPersonalizado: Story = {
  name: "StatusTag: rótulo personalizado",
  render: () => <StatusTag status="failed">Falhou ao baixar</StatusTag>,
};

/** Dentro de uma linha de lista, com texto longo ao lado: o selo nunca quebra nem encolhe. */
export const EmLinha: Story = {
  name: "StatusTag: em linha de lista",
  render: () => (
    <div style={{ width: 460, display: "flex", flexDirection: "column", gap: 8 }}>
      {(Object.keys(statusSpecs) as Status[]).slice(0, 3).map((s) => (
        <div
          key={s}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            border: "2px solid var(--color-divider)",
            borderRadius: "var(--radius-card)",
            font: "400 17px/26px var(--font-sans)",
          }}
        >
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Manual do candidato, edição revisada e ampliada, capítulos 1 a 12.pdf
          </span>
          <StatusTag status={s} />
        </div>
      ))}
    </div>
  ),
};
