export const metaKeys = {
  all: ["meta"] as const,
  ufs: () => [...metaKeys.all, "ufs"] as const,
  competencias: () => [...metaKeys.all, "competencias"] as const,
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (uf: string, competencia: string) => [...dashboardKeys.all, "summary", uf, competencia] as const,
  kpis: (uf: string, competencia: string) => [...dashboardKeys.all, "kpis", uf, competencia] as const,
  topCountries: (uf: string, competencia: string, topN: number) =>
    [...dashboardKeys.all, "topCountries", uf, competencia, topN] as const,
  salaryAgeGender: (uf: string, competencia: string) => [...dashboardKeys.all, "salaryAgeGender", uf, competencia] as const,
  salaryBox: (uf: string, competencia: string) => [...dashboardKeys.all, "salaryBox", uf, competencia] as const,
  treemap: (uf: string, competencia: string) => ["treemap", uf, competencia] as const,
  timeseries: (uf: string) => [...dashboardKeys.all, "timeseries", uf] as const,
  heatmap: (uf: string, competencia: string) => [...dashboardKeys.all, "heatmap", uf, competencia] as const,
  topMunicipios: (uf: string, competencia: string, topN: number) =>
    [...dashboardKeys.all, "topMunicipios", uf, competencia, topN] as const,
  table: (uf: string, competencia: string, limit: number, offset: number, sort: string) =>
    [...dashboardKeys.all, "table", uf, competencia, limit, offset, sort] as const,
};
