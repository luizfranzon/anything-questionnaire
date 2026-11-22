import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateRangePicker, metricsPresets, type DateRangeValue } from "./DateRangePicker";
import { RangeCalendar, type DateRange } from "./RangeCalendar";

const TODAY = "2026-11-22";
const caption: React.CSSProperties = { font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)", margin: "0 0 8px" };
const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "var(--space-6)", alignItems: "flex-start" };

const meta = {
  title: "Componentes/Calendário de período",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Cal({ initial = { from: "", to: "" }, ...rest }: { initial?: DateRange } & Partial<React.ComponentProps<typeof RangeCalendar>>) {
  const [value, setValue] = useState<DateRange>(initial);
  return <RangeCalendar today={TODAY} max={TODAY} {...rest} value={value} onChange={setValue} />;
}

/* ---------- RangeCalendar ---------- */

/** Interativo: dois cliques, a prévia segue o mouse, o segundo dia antes do primeiro inverte. */
export const Calendario: Story = { render: () => <Cal initial={{ from: "2026-11-08", to: "2026-11-15" }} /> };

export const CalendarioEstados: Story = {
  render: () => (
    <div style={row}>
      <div>
        <p style={caption}>Período escolhido</p>
        <Cal initial={{ from: "2026-11-08", to: "2026-11-15" }} />
      </div>
      <div>
        <p style={caption}>Sem período</p>
        <Cal />
      </div>
      <div>
        <p style={caption}>Primeiro clique, com prévia até o dia 17</p>
        <Cal initial={{ from: "", to: "" }} forceAnchor="2026-11-10" forceHover="2026-11-17" />
      </div>
      <div>
        <p style={caption}>Prévia para trás (os dias se invertem)</p>
        <Cal forceAnchor="2026-11-12" forceHover="2026-11-04" />
      </div>
      <div>
        <p style={caption}>Um dia só</p>
        <Cal initial={{ from: "2026-11-12", to: "2026-11-12" }} />
      </div>
      <div>
        <p style={caption}>Período que cruza semanas e meses</p>
        <Cal initial={{ from: "2026-10-28", to: "2026-11-04" }} />
      </div>
      <div>
        <p style={caption}>Hoje no fim do período (futuro desabilitado)</p>
        <Cal initial={{ from: "2026-11-16", to: "2026-11-22" }} />
      </div>
      <div>
        <p style={caption}>Limites: de 05/11 a 18/11</p>
        <Cal initial={{ from: "2026-11-09", to: "2026-11-12" }} min="2026-11-05" max="2026-11-18" />
      </div>
      <div>
        <p style={caption}>Outro ano</p>
        <Cal initial={{ from: "2025-12-29", to: "2026-01-03" }} today="2025-12-31" max={undefined} />
      </div>
    </div>
  ),
};

/* ---------- DateRangePicker ---------- */

function Picker({ initial, ...rest }: { initial: DateRangeValue } & Partial<React.ComponentProps<typeof DateRangePicker>>) {
  const [value, setValue] = useState(initial);
  return (
    <div style={{ width: 380 }}>
      <DateRangePicker label="Período" presets={metricsPresets} today={TODAY} {...rest} value={value} onChange={setValue} />
    </div>
  );
}

export const CampoDePeriodo: Story = {
  render: () => <div style={{ minHeight: 520 }}><Picker initial={{ preset: "30d", from: "", to: "" }} /></div>,
};
/** Aberto: atalhos à esquerda, calendário à direita. */
export const CampoAberto: Story = {
  render: () => <div style={{ minHeight: 520 }}><Picker initial={{ preset: "7d", from: "", to: "" }} defaultOpen /></div>,
};
export const CampoAbertoPersonalizado: Story = {
  render: () => <div style={{ minHeight: 520 }}><Picker initial={{ preset: "custom", from: "2026-11-02", to: "2026-11-14" }} defaultOpen /></div>,
};
export const CampoAbertoSemPeriodo: Story = {
  render: () => <div style={{ minHeight: 520 }}><Picker initial={{ preset: "custom", from: "", to: "" }} defaultOpen /></div>,
};

export const CampoEstados: Story = {
  render: () => (
    <div style={{ ...row, gap: "var(--space-5) var(--space-6)" }}>
      <div>
        <p style={caption}>Atalho</p>
        <Picker initial={{ preset: "30d", from: "", to: "" }} />
      </div>
      <div>
        <p style={caption}>Período personalizado</p>
        <Picker initial={{ preset: "custom", from: "2026-11-02", to: "2026-11-14" }} />
      </div>
      <div>
        <p style={caption}>Período de outro ano</p>
        <Picker initial={{ preset: "custom", from: "2025-12-20", to: "2026-01-05" }} />
      </div>
      <div>
        <p style={caption}>Sem período</p>
        <Picker initial={{ preset: "custom", from: "", to: "" }} />
      </div>
      <div>
        <p style={caption}>Hover</p>
        <Picker initial={{ preset: "7d", from: "", to: "" }} forceState="hover" />
      </div>
      <div>
        <p style={caption}>Foco do teclado</p>
        <Picker initial={{ preset: "7d", from: "", to: "" }} forceState="focus" />
      </div>
      <div>
        <p style={caption}>Carregando</p>
        <Picker initial={{ preset: "7d", from: "", to: "" }} loading />
      </div>
      <div>
        <p style={caption}>Com erro</p>
        <Picker initial={{ preset: "custom", from: "", to: "" }} error="Escolha o período." />
      </div>
      <div>
        <p style={caption}>Desabilitado</p>
        <Picker initial={{ preset: "7d", from: "", to: "" }} disabled />
      </div>
    </div>
  ),
};
