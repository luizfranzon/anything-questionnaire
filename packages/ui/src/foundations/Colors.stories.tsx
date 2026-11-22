import type { Meta, StoryObj } from "@storybook/react-vite";

const groups: Record<string, [string, string][]> = {
  Texto: [
    ["text", "Texto principal"],
    ["text-muted", "Secundário, legendas"],
    ["text-placeholder", "Exemplo em campo vazio"],
    ["text-disabled", "Indisponível"],
  ],
  Superfícies: [
    ["background", "Fundo da página"],
    ["surface", "Cartões de escolha"],
    ["fill-1", "Zonas e campos"],
    ["fill-2", "Zonas em destaque"],
    ["dark", "Painel de correção"],
  ],
  Linhas: [
    ["border", "Borda de cartão e campo"],
    ["border-hover", "Borda no hover"],
    ["divider", "Divisor entre linhas"],
  ],
  Ação: [
    ["primary", "Ação principal"],
    ["primary-hover", "Hover"],
    ["primary-pressed", "Pressionado"],
    ["on-primary", "Texto sobre a ação"],
    ["focus", "Anel de foco"],
  ],
  Status: [
    ["success", "Acerto"],
    ["success-bg", "Fundo de acerto"],
    ["danger", "Erro"],
    ["danger-bg", "Fundo de erro"],
    ["warn", "Dúvida (chutei)"],
    ["warn-bg", "Fundo de dúvida"],
  ],
};

function Swatch({ role, job }: { role: string; job: string }) {
  return (
    <div style={{ width: 168 }}>
      <div
        style={{
          height: 64,
          borderRadius: "var(--radius-card)",
          background: `var(--color-${role})`,
          border: "1px solid var(--color-divider)",
        }}
      />
      <div style={{ font: "600 14px/20px var(--font-sans)", marginTop: 8 }}>{role}</div>
      <div style={{ font: "400 13px/18px var(--font-sans)", color: "var(--color-text-muted)" }}>{job}</div>
    </div>
  );
}

function Colors() {
  return (
    <div style={{ display: "grid", gap: 40, maxWidth: 1000 }}>
      {Object.entries(groups).map(([name, items]) => (
        <section key={name}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 26, margin: "0 0 16px" }}>
            {name}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {items.map(([role, job]) => (
              <Swatch key={role} role={role} job={job} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const meta = { title: "Fundamentos/Cores", component: Colors } satisfies Meta<typeof Colors>;
export default meta;

export const Papeis: StoryObj<typeof meta> = {};
