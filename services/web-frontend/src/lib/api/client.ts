import { z, ZodError } from "zod";
import { requestJson } from "./http";
import {
  DashboardKpiPanelSchema,
  DashboardSummarySchema,
  EmptyAwareRowsSchema,
  HeatmapSalarySectorAgeSchema,
  MapSetCompetenciaSchema,
  SalaryAgeGenderRowSchema,
  SalaryBoxEducationRowSchema,
  StringListSchema,
  TimeseriesSaldoRowSchema,
  TopBottomRowSchema,
  TopCountryRowSchema,
  TreemapResponseSchema,
  type DashboardKpiPanel,
  type DashboardSummary,
  type DashboardTableRow,
  type HeatmapSalarySectorAge,
  type MapSetCompetencia,
  type SalaryAgeGenderRow,
  type SalaryBoxEducationRow,
  type TimeseriesSaldoRow,
  type TopBottomRow,
  type TopCountryRow,
  type TreemapSectorCountryRow,
  DashboardTableRowSchema,
} from "./schemas";

export interface EmptyAwareRows<T> {
  rows: T[];
  missing_fields: string[];
}

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, endpoint: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`[api-parse] ${endpoint}`, error, data);
    }
    if (error instanceof ZodError) {
      throw new Error(`Resposta inválida de ${endpoint}: ${error.issues[0]?.message ?? "schema mismatch"}`);
    }
    throw error;
  }
}

export async function getAvailableCompetencias(): Promise<string[]> {
  const data = await requestJson<unknown>("/api/meta/available_competencias");
  return parseOrThrow(StringListSchema, data, "/api/meta/available_competencias");
}

export async function getAvailableUfs(): Promise<string[]> {
  const data = await requestJson<unknown>("/api/meta/available_ufs");
  return parseOrThrow(StringListSchema, data, "/api/meta/available_ufs");
}

export async function getDashboardSummary(uf: string, competencia: string): Promise<DashboardSummary> {
  const params = new URLSearchParams({ uf, competencia });
  const data = await requestJson<unknown>(`/api/dashboard/summary?${params}`);
  return parseOrThrow(DashboardSummarySchema, data, "/api/dashboard/summary");
}

export async function getDashboardKpiPanel(uf: string, competencia: string): Promise<DashboardKpiPanel> {
  const params = new URLSearchParams({ uf, competencia });
  const data = await requestJson<unknown>(`/api/dashboard/kpi_panel?${params}`);
  return parseOrThrow(DashboardKpiPanelSchema, data, "/api/dashboard/kpi_panel");
}

export async function getTopCountries(
  uf: string,
  competencia: string,
  topN: number
): Promise<EmptyAwareRows<TopCountryRow>> {
  const params = new URLSearchParams({ uf, competencia, top_n: String(topN) });
  const data = await requestJson<unknown>(`/api/dashboard/top_countries?${params}`);
  return parseOrThrow(EmptyAwareRowsSchema(TopCountryRowSchema), data, "/api/dashboard/top_countries");
}

export async function getSalaryByAgeGender(
  uf: string,
  competencia: string
): Promise<EmptyAwareRows<SalaryAgeGenderRow>> {
  const params = new URLSearchParams({ uf, competencia });
  const data = await requestJson<unknown>(`/api/dashboard/salary_by_age_gender?${params}`);
  return parseOrThrow(EmptyAwareRowsSchema(SalaryAgeGenderRowSchema), data, "/api/dashboard/salary_by_age_gender");
}

export async function getSalaryBoxByEducation(
  uf: string,
  competencia: string
): Promise<EmptyAwareRows<SalaryBoxEducationRow>> {
  const params = new URLSearchParams({ uf, competencia });
  const data = await requestJson<unknown>(`/api/dashboard/salary_box_by_education?${params}`);
  return parseOrThrow(
    EmptyAwareRowsSchema(SalaryBoxEducationRowSchema),
    data,
    "/api/dashboard/salary_box_by_education"
  );
}

export async function getTreemapSectorCountry(
  uf: string,
  competencia: string
): Promise<TreemapSectorCountryRow[]> {
  const params = new URLSearchParams({ uf, competencia });
  const data = await requestJson<unknown>(`/api/dashboard/treemap_sector_country?${params}`);
  const parsed = parseOrThrow(TreemapResponseSchema, data, "/api/dashboard/treemap_sector_country");
  return Array.isArray(parsed) ? parsed : parsed.rows;
}

export async function getTimeseriesSaldo(
  uf: string,
  from?: string,
  to?: string
): Promise<EmptyAwareRows<TimeseriesSaldoRow>> {
  const params = new URLSearchParams({ uf });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const data = await requestJson<unknown>(`/api/dashboard/timeseries_saldo?${params}`);
  return parseOrThrow(EmptyAwareRowsSchema(TimeseriesSaldoRowSchema), data, "/api/dashboard/timeseries_saldo");
}

export async function getHeatmapSalarySectorAge(uf: string, competencia: string): Promise<HeatmapSalarySectorAge> {
  const params = new URLSearchParams({ uf, competencia });
  const data = await requestJson<unknown>(`/api/dashboard/heatmap_salary_sector_age?${params}`);
  return parseOrThrow(HeatmapSalarySectorAgeSchema, data, "/api/dashboard/heatmap_salary_sector_age");
}

export async function getTopMunicipiosMov(
  uf: string,
  competencia: string,
  topN: number
): Promise<EmptyAwareRows<TopBottomRow>> {
  const params = new URLSearchParams({ uf, competencia, top_n: String(topN) });
  const data = await requestJson<unknown>(`/api/dashboard/top_municipios_mov?${params}`);
  return parseOrThrow(EmptyAwareRowsSchema(TopBottomRowSchema), data, "/api/dashboard/top_municipios_mov");
}

export async function getDashboardTable(
  uf: string,
  competencia: string,
  limit = 500,
  offset = 0,
  sort = "saldo_sum:desc"
): Promise<EmptyAwareRows<DashboardTableRow>> {
  const params = new URLSearchParams({
    uf,
    competencia,
    limit: String(limit),
    offset: String(offset),
    sort,
  });
  const data = await requestJson<unknown>(`/api/dashboard/table?${params}`);
  return parseOrThrow(EmptyAwareRowsSchema(DashboardTableRowSchema), data, "/api/dashboard/table");
}

export async function setMapCompetencia(uf: string, competenciamov: string): Promise<MapSetCompetencia> {
  const data = await requestJson<unknown>("/api/map/set_competencia", {
    method: "POST",
    body: JSON.stringify({ uf, competenciamov }),
  });
  return parseOrThrow(MapSetCompetenciaSchema, data, "/api/map/set_competencia");
}
