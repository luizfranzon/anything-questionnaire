/** Datas do calendário como texto `aaaa-mm-dd` (hora local, sem fuso). Comparar texto ordena certo. */
export type ISODate = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export const toISO = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = (): ISODate => toISO(new Date());

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
/** Soma meses mantendo o dia quando existe, senão o último dia do mês (31/01 + 1 = 28/02). */
export function addMonths(iso: ISODate, n: number): ISODate {
  const d = parseISO(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISO(d);
}
export const startOfMonth = (iso: ISODate): ISODate => `${iso.slice(0, 7)}-01`;
export const sameMonth = (a: ISODate, b: ISODate) => a.slice(0, 7) === b.slice(0, 7);
export const weekday = (iso: ISODate) => parseISO(iso).getDay();

export function clamp(iso: ISODate, min?: ISODate, max?: ISODate): ISODate {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

/** Seis semanas de sete dias, começando no domingo. Dias fora do mês vêm `null` (a grade não os mostra). */
export function monthGrid(firstOfMonth: ISODate): (ISODate | null)[][] {
  const d = parseISO(firstOfMonth);
  const lead = d.getDay();
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const cells: (ISODate | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let n = 1; n <= days; n++) cells.push(`${firstOfMonth.slice(0, 7)}-${pad(n)}`);
  while (cells.length < 42) cells.push(null);
  return Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

export const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const WEEKDAYS = [
  { short: "D", long: "domingo" },
  { short: "S", long: "segunda-feira" },
  { short: "T", long: "terça-feira" },
  { short: "Q", long: "quarta-feira" },
  { short: "Q", long: "quinta-feira" },
  { short: "S", long: "sexta-feira" },
  { short: "S", long: "sábado" },
];

/** "22/11", ou "22/11/2025" quando o ano não é o de referência. */
export function formatShort(iso: ISODate, refYear: number): string {
  const [y, m, d] = iso.split("-");
  return Number(y) === refYear ? `${d}/${m}` : `${d}/${m}/${y}`;
}
/** "22 de novembro de 2026", para leitores de tela. */
export function formatLong(iso: ISODate): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
}
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000) + 1;
}
