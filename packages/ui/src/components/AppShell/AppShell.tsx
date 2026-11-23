import type { MouseEvent, ReactNode } from "react";
import { motion } from "motion/react";
import { BarChart3, LogOut, Settings, BookOpen } from "lucide-react";
import { transition } from "../../motion";
import { Button } from "../Button/Button";
import "./AppShell.css";

export type AppSection = "studies" | "metrics" | "settings";
export type AppShellWidth = "reading" | "content" | "wide";

const NAV: { id: AppSection; label: string; icon: ReactNode }[] = [
  { id: "studies", label: "Estudos", icon: <BookOpen size={18} aria-hidden /> },
  { id: "metrics", label: "Métricas", icon: <BarChart3 size={18} aria-hidden /> },
  { id: "settings", label: "Configurações", icon: <Settings size={18} aria-hidden /> },
];

/** Destinos que já existem no app. Métricas ainda não tem tela, então segue em `#`. */
const DEFAULT_HREFS: Partial<Record<AppSection, string>> = { studies: "/studies", settings: "/settings" };

export interface AppShellProps {
  /** Seção atual da navegação. Na variante `focus` não há navegação. */
  current?: AppSection;
  /** `default`: barra com navegação. `focus`: só o nome e a saída, para responder uma Pergunta sem distração. */
  variant?: "default" | "focus";
  /** Largura da área de conteúdo: `reading` 640px, `content` 960px, `wide` 1200px. */
  width?: AppShellWidth;
  /** Destino de cada item. Sem valor, usa o destino padrão do app (Estudos e Configurações) ou `#`. */
  hrefs?: Partial<Record<AppSection | "home", string>>;
  /** Chamado ao clicar num item; se existir, a navegação nativa é cancelada (para roteadores). */
  onNavigate?: (target: AppSection | "home") => void;
  /** Só na variante `focus`: rótulo e ação de sair. Sem `onExit`, o botão não aparece (telas que bloqueiam o app). */
  exitLabel?: string;
  onExit?: () => void;
  children: ReactNode;
  className?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: Partial<Record<AppSection | "home", "hover" | "pressed" | "focus">>;
}

/** Estrutura da aplicação: barra superior e área de conteúdo centralizada. */
export function AppShell({
  current,
  variant = "default",
  width = "content",
  hrefs = {},
  onNavigate,
  exitLabel = "Sair da Rodada",
  onExit,
  children,
  className,
  forceState = {},
}: AppShellProps) {
  const click = (target: AppSection | "home") => (e: MouseEvent) => {
    if (!onNavigate) return;
    e.preventDefault();
    onNavigate(target);
  };

  return (
    <div className={["app-shell", className].filter(Boolean).join(" ")}>
      <a className="app-shell__skip" href="#app-shell-content">
        Pular para o conteúdo
      </a>
      <header className="app-shell__bar">
        <div className="app-shell__bar-inner">
          <a
            className="app-shell__brand"
            href={hrefs.home ?? hrefs.studies ?? "#"}
            data-state={forceState.home}
            onClick={click("home")}
          >
            Anything Questionnaire
          </a>
          {variant === "default" ? (
            <nav aria-label="Principal">
              <ul className="app-shell__nav">
                {NAV.map((item) => {
                  const active = item.id === current;
                  return (
                    <li key={item.id}>
                      <motion.a
                        className="app-shell__link"
                        href={hrefs[item.id] ?? DEFAULT_HREFS[item.id] ?? "#"}
                        aria-current={active ? "page" : undefined}
                        data-state={forceState[item.id]}
                        onClick={click(item.id)}
                      >
                        {item.icon}
                        {item.label}
                        {active && (
                          <motion.span
                            layoutId="app-shell-indicator"
                            className="app-shell__indicator"
                            transition={transition.soft}
                          />
                        )}
                      </motion.a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : onExit ? (
            <Button variant="secondary" icon={<LogOut size={18} aria-hidden />} onClick={onExit}>
              {exitLabel}
            </Button>
          ) : null}
        </div>
      </header>
      <main id="app-shell-content" tabIndex={-1} className={`app-shell__main app-shell__main--${width}`}>
        {children}
      </main>
    </div>
  );
}
