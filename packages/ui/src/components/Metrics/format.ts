/** Formatos das Métricas: pt-BR, custo em US$ (DESIGN.md). */
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("pt-BR");
const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

/** 1.240.000 -> "1,2 mi". Para eixos e selos. */
export const formatTokensCompact = (n: number) => compact.format(n);
/** 1.240.000 -> "1.240.000". Para tabelas e leitores de tela. */
export const formatTokens = (n: number) => full.format(n);
/** 1.2 -> "US$ 1,20". */
export const formatCost = (n: number) => usd.format(n);
/** 0.72 -> "72%". */
export const formatPercent = (n: number) => percent.format(n);
