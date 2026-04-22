import { useMemo } from "react";
import {
  useDashboardKpiPanel,
  useDashboardTable,
  useHeatmapSalarySectorAge,
  useSalaryBoxByEducation,
  useSalaryByAgeGender,
  useTimeseriesSaldo,
  useTopCountries,
  useTopMunicipiosMov,
  useTreemapSectorCountry,
} from "../lib/query/hooks";
import type {
  DashboardKpiPanel,
  DashboardTableRow,
  HeatmapSalarySectorAge,
  SalaryAgeGenderRow,
  SalaryBoxEducationRow,
  TimeseriesSaldoRow,
  TopBottomRow,
  TopCountryRow,
  TreemapSectorCountryRow,
} from "../lib/api/schemas";
import type { EmptyAwareRows } from "../lib/api/client";

interface UseDashboardDataResult {
  loading: boolean;
  error: string | null;
  kpis: DashboardKpiPanel | null;
  topCountries: EmptyAwareRows<TopCountryRow> | null;
  salaryByAgeGender: EmptyAwareRows<SalaryAgeGenderRow> | null;
  salaryBoxByEducation: EmptyAwareRows<SalaryBoxEducationRow> | null;
  treemapSectorCountry: TreemapSectorCountryRow[] | null;
  timeseriesSaldo: EmptyAwareRows<TimeseriesSaldoRow> | null;
  heatmapSalarySectorAge: HeatmapSalarySectorAge | null;
  topMunicipiosMov: EmptyAwareRows<TopBottomRow> | null;
  tableRows: EmptyAwareRows<DashboardTableRow> | null;
}

export function useDashboardData(
  uf: string,
  competencia: string,
  topCountriesN: number,
  topMunicipiosN: number
): UseDashboardDataResult {
  const competenciaSafe = /^\d{4}-\d{2}$/.test(competencia) ? competencia : "";
  const enabled = Boolean(uf && competenciaSafe);
  const qKpis = useDashboardKpiPanel(uf, competenciaSafe);
  const qTopCountries = useTopCountries(uf, competenciaSafe, topCountriesN);
  const qSalaryAgeGender = useSalaryByAgeGender(uf, competenciaSafe);
  const qSalaryBox = useSalaryBoxByEducation(uf, competenciaSafe);
  const qTreemap = useTreemapSectorCountry(uf, competenciaSafe);
  const qTimeseries = useTimeseriesSaldo(uf);
  const qHeatmap = useHeatmapSalarySectorAge(uf, competenciaSafe);
  const qTopMunicipios = useTopMunicipiosMov(uf, competenciaSafe, topMunicipiosN);
  const qTable = useDashboardTable(uf, competenciaSafe, 500, 0, "saldo_sum:desc");

  const loading = [
    qKpis,
    qTopCountries,
    qSalaryAgeGender,
    qSalaryBox,
    qTreemap,
    qTimeseries,
    qHeatmap,
    qTopMunicipios,
    qTable,
  ].some((q) => q.isLoading || q.isFetching);

  const firstError = enabled
    ? [
    qKpis.error,
    qTopCountries.error,
    qSalaryAgeGender.error,
    qSalaryBox.error,
    qTreemap.error,
    qTimeseries.error,
    qHeatmap.error,
    qTopMunicipios.error,
    qTable.error,
      ].find(Boolean)
    : null;

  return useMemo(() => {
    return {
      loading,
      error: firstError ? (firstError as Error).message : null,
      kpis: qKpis.data ?? null,
      topCountries: qTopCountries.data ?? null,
      salaryByAgeGender: qSalaryAgeGender.data ?? null,
      salaryBoxByEducation: qSalaryBox.data ?? null,
      treemapSectorCountry: qTreemap.data ?? null,
      timeseriesSaldo: qTimeseries.data ?? null,
      heatmapSalarySectorAge: qHeatmap.data ?? null,
      topMunicipiosMov: qTopMunicipios.data ?? null,
      tableRows: qTable.data ?? null,
    };
  }, [
    loading,
    firstError,
    qKpis.data,
    qTopCountries.data,
    qSalaryAgeGender.data,
    qSalaryBox.data,
    qTreemap.data,
    qTimeseries.data,
    qHeatmap.data,
    qTopMunicipios.data,
    qTable.data,
  ]);
}

