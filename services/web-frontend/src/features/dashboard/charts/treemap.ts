import type { TreemapSectorCountryRow } from "../../../lib/api/schemas";
import { quantile } from "./chartHelpers";

export interface TreemapPrepared {
  data?: Array<Record<string, unknown>>;
  globalMin?: number;
  globalMax?: number;
  robustMin?: number;
  robustMax?: number;
  salaryMissing?: boolean;
  empty?: string;
  error?: string;
}

export const TREEMAP_MOCK_ROWS: TreemapSectorCountryRow[] = [
  { secao: "Industria", pais: "Venezuela", contagem: 120, salario_medio: 2800 },
  { secao: "Industria", pais: "Haiti", contagem: 80, salario_medio: 2400 },
  { secao: "Comercio", pais: "Paraguai", contagem: 60, salario_medio: 3100 },
  { secao: "Construcao", pais: "Argentina", contagem: 40, salario_medio: 2600 },
];

export function prepareTreemap(
  sourceRows: TreemapSectorCountryRow[] | null,
  mockEnabled: boolean
): TreemapPrepared {
  try {
    const rows = (mockEnabled ? TREEMAP_MOCK_ROWS : sourceRows ?? []).filter(
      (r) => r.secao.trim() && r.pais.trim() && Number.isFinite(r.contagem) && r.contagem > 0
    );
    if (rows.length === 0) {
      return { empty: "No rows for secao × pais for these filters." };
    }

    const salaries = rows.map((r) => r.salario_medio).filter((v): v is number => v !== null && Number.isFinite(v));
    const sorted = [...salaries].sort((a, b) => a - b);
    const globalMin = sorted.length ? sorted[0] : 0;
    let globalMax = sorted.length ? sorted[sorted.length - 1] : 1;
    if (!(globalMax > globalMin)) globalMax = globalMin + 1;
    const robustMin = sorted.length ? quantile(sorted, 0.05) : globalMin;
    let robustMax = sorted.length ? quantile(sorted, 0.95) : globalMax;
    if (!(robustMax > robustMin)) robustMax = robustMin + 1;

    const nodes = rows.map((row) => ({
      name: `${row.secao} / ${row.pais}`,
      value: row.contagem,
      itemStyle: {
        color: row.salario_medio === null ? "#64748b" : undefined,
      },
      salario: row.salario_medio,
      secao: row.secao,
      pais: row.pais,
    }));

    const sectors = new Map<string, typeof nodes>();
    for (const node of nodes) {
      const existing = sectors.get(node.secao) ?? [];
      existing.push(node);
      sectors.set(node.secao, existing);
    }

    const data = Array.from(sectors.entries()).map(([secao, list]) => {
      const sectorTotal = list.reduce((s, c) => s + c.value, 0);
      const withSalario = list.filter((c) => c.salario != null && Number.isFinite(c.salario));
      const sectorAvgSalary =
        withSalario.length > 0
          ? withSalario.reduce((s, c) => s + (c.salario ?? 0) * c.value, 0) / withSalario.reduce((s, c) => s + c.value, 0)
          : robustMin;
      return {
        name: secao,
        value: [sectorTotal, sectorAvgSalary],
        secao,
        salario: sectorAvgSalary,
        children: list.map((c) => ({
          name: c.pais,
          value: [c.value, c.salario ?? robustMin],
          salario: c.salario,
          secao,
        })),
      };
    });

    return {
      data,
      globalMin,
      globalMax,
      robustMin,
      robustMax,
      salaryMissing: salaries.length === 0,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
