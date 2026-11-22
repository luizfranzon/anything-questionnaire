import type { Meta, StoryObj } from "@storybook/react-vite";

const scale = [
  ["display", "serif", "Estudos"],
  ["prompt", "serif", "Qual destes é um efeito colateral comum da cafeína?"],
  ["title", "serif", "Tópicos do Estudo"],
  ["lead", "serif", "O Gabarito está na página 12 da Fonte."],
  ["body", "sans", "Revisões vencidas hoje: 8. Comece uma Rodada a partir delas."],
  ["small", "sans", "Última Rodada em 22/11, modo simulado, 14/20."],
  ["caption", "sans", "Fonte capturada uma única vez."],
] as const;

function Typography() {
  return (
    <div style={{ display: "grid", gap: 28, maxWidth: 900 }}>
      {scale.map(([name, family, sample]) => (
        <div key={name}>
          <div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" }}>
            {name} · {family === "serif" ? "Young Serif" : "Figtree"}
          </div>
          <div
            style={{
              fontFamily: `var(--font-${family})`,
              fontSize: `var(--text-${name})`,
              lineHeight: `var(--leading-${name})`,
              fontWeight: 400,
            }}
          >
            {sample}
          </div>
        </div>
      ))}
    </div>
  );
}

const meta = { title: "Fundamentos/Tipografia", component: Typography } satisfies Meta<typeof Typography>;
export default meta;

export const Escala: StoryObj<typeof meta> = {};
