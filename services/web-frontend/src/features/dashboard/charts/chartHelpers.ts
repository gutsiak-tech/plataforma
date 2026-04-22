export function quantile(sorted: number[], q: number) {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const frac = pos - base;
  return sorted[base] + (sorted[Math.min(base + 1, sorted.length - 1)] - sorted[base]) * frac;
}

const EDUCATION_ORDER = [
  { shortLabel: "Fund.\nincompleto", aliases: ["sem instrucao", "sem instrução", "fundamental incompleto"] },
  { shortLabel: "Fund.\ncompleto", aliases: ["fundamental completo"] },
  { shortLabel: "Médio\nincompleto", aliases: ["medio incompleto", "médio incompleto"] },
  { shortLabel: "Médio\ncompleto", aliases: ["medio completo", "médio completo"] },
  { shortLabel: "Superior\nincompleto", aliases: ["superior incompleto"] },
  { shortLabel: "Superior\ncompleto", aliases: ["superior completo"] },
  { shortLabel: "Pós-\ngraduação", aliases: ["pos", "pós"] },
] as const;

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Ordem crescente das faixas etárias (menos de 18 primeiro, 65+ por último). */
export function faixaEtariaOrder(label: string): number {
  const n = normalizeText(label);
  if (n.includes("menos de 18")) return 0;
  if (n.includes("18 a 24")) return 1;
  if (n.includes("25 a 29")) return 2;
  if (n.includes("30 a 39")) return 3;
  if (n.includes("40 a 49")) return 4;
  if (n.includes("50 a 64")) return 5;
  if (n.includes("65 anos") || n.includes("65 ou mais")) return 6;
  return 99;
}

export function educationLabelInfo(label: string) {
  const normalized = normalizeText(label);
  const order = EDUCATION_ORDER.findIndex((item) =>
    item.aliases.some((alias) => normalized.includes(normalizeText(alias)))
  );
  return {
    order: order >= 0 ? order : 999,
    shortLabel: order >= 0 ? EDUCATION_ORDER[order].shortLabel : label,
  };
}
