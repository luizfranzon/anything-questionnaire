import type { Meta, StoryObj } from "@storybook/react-vite";

const label = { font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" } as const;
const heading = { fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 26, margin: "0 0 16px" } as const;

function Spacing() {
  return (
    <div style={{ display: "grid", gap: 40 }}>
      <section>
        <h2 style={heading}>Espaçamento</h2>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <span style={{ ...label, width: 72 }}>space-{s}</span>
            <div style={{ height: 16, width: `var(--space-${s})`, background: "var(--color-primary)" }} />
          </div>
        ))}
      </section>
      <section>
        <h2 style={heading}>Raios</h2>
        <div style={{ display: "flex", gap: 24 }}>
          {["sm", "card", "block", "pill"].map((r) => (
            <div key={r}>
              <div
                style={{
                  width: 120,
                  height: 72,
                  background: "var(--color-fill-1)",
                  border: "2px solid var(--color-border)",
                  borderRadius: `var(--radius-${r})`,
                }}
              />
              <div style={{ ...label, marginTop: 8 }}>radius-{r}</div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 style={heading}>Sombras (só para o que flutua)</h2>
        <div style={{ display: "flex", gap: 32 }}>
          {["float", "float-strong"].map((s) => (
            <div key={s}>
              <div
                style={{
                  width: 160,
                  height: 72,
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-card)",
                  boxShadow: `var(--shadow-${s})`,
                }}
              />
              <div style={{ ...label, marginTop: 8 }}>shadow-{s}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta = { title: "Fundamentos/Espaçamento e formas", component: Spacing } satisfies Meta<typeof Spacing>;
export default meta;

export const Escalas: StoryObj<typeof meta> = {};
