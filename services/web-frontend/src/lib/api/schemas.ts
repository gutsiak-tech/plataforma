import { z } from "zod";

export const StringListSchema = z.array(z.string());

export const DashboardSummarySchema = z.object({
  uf: z.string(),
  competencia: z.string(),
  municipio_count: z.number(),
  total_saldo: z.number(),
  min_saldo: z.number().nullable(),
  max_saldo: z.number().nullable(),
});

export const DashboardKpiPanelSchema = z.object({
  uf: z.string(),
  competencia: z.string(),
  total_records: z.number(),
  salary_mean: z.number().nullable(),
  salary_median: z.number().nullable(),
  salary_p90: z.number().nullable(),
  countries_count: z.number(),
  missing_fields: z.array(z.string()),
});

export const TopCountryRowSchema = z.object({
  pais: z.string(),
  total: z.number(),
});

export const SalaryAgeGenderRowSchema = z.object({
  faixa_etaria: z.string(),
  sexo: z.string(),
  salario_medio: z.number(),
  total: z.number(),
});

export const SalaryBoxEducationRowSchema = z.object({
  nivel_instrucao: z.string(),
  min_salary: z.number(),
  q1_salary: z.number(),
  median_salary: z.number(),
  q3_salary: z.number(),
  max_salary: z.number(),
  total: z.number(),
});

export const TreemapSectorCountryRowSchema = z.object({
  secao: z.string(),
  pais: z.string(),
  contagem: z.number(),
  salario_medio: z.number().nullable(),
});

export const TimeseriesSaldoRowSchema = z.object({
  competenciamov: z.string(),
  saldo_sum: z.number(),
});

export const HeatmapSalarySectorAgeSchema = z.object({
  rows: z.array(z.string()),
  cols: z.array(z.string()),
  values: z.array(z.array(z.number().nullable())),
  missing_fields: z.array(z.string()),
});

export const TopBottomRowSchema = z.object({
  municipio: z.string(),
  saldo_sum: z.number(),
});

export const DashboardTableRowSchema = z.object({
  municipio: z.string(),
  saldo_sum: z.number(),
  salario_medio: z.number().nullable(),
  registros: z.number(),
});

export const EmptyAwareRowsSchema = <T extends z.ZodTypeAny>(rowSchema: T) =>
  z.object({
    rows: z.array(rowSchema),
    missing_fields: z.array(z.string()),
  });

export const TreemapResponseSchema = z.union([
  z.array(TreemapSectorCountryRowSchema),
  z.object({
    rows: z.array(TreemapSectorCountryRowSchema),
    missing_fields: z.array(z.string()).optional(),
  }),
]);

export const MapSetCompetenciaSchema = z.object({
  uf: z.string(),
  competenciamov: z.string(),
});

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
export type DashboardKpiPanel = z.infer<typeof DashboardKpiPanelSchema>;
export type TopCountryRow = z.infer<typeof TopCountryRowSchema>;
export type SalaryAgeGenderRow = z.infer<typeof SalaryAgeGenderRowSchema>;
export type SalaryBoxEducationRow = z.infer<typeof SalaryBoxEducationRowSchema>;
export type TreemapSectorCountryRow = z.infer<typeof TreemapSectorCountryRowSchema>;
export type TimeseriesSaldoRow = z.infer<typeof TimeseriesSaldoRowSchema>;
export type HeatmapSalarySectorAge = z.infer<typeof HeatmapSalarySectorAgeSchema>;
export type TopBottomRow = z.infer<typeof TopBottomRowSchema>;
export type DashboardTableRow = z.infer<typeof DashboardTableRowSchema>;
export type MapSetCompetencia = z.infer<typeof MapSetCompetenciaSchema>;
