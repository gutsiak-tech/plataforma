import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getAvailableCompetencias,
  getAvailableUfs,
  getDashboardKpiPanel,
  getDashboardSummary,
  getDashboardTable,
  getHeatmapSalarySectorAge,
  getSalaryBoxByEducation,
  getSalaryByAgeGender,
  getTimeseriesSaldo,
  getTopCountries,
  getTopMunicipiosMov,
  getTreemapSectorCountry,
  setMapCompetencia,
} from "../api/client";
import { dashboardKeys, metaKeys } from "./keys";

export function useAvailableUFs() {
  return useQuery({
    queryKey: metaKeys.ufs(),
    queryFn: getAvailableUfs,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useAvailableCompetencias() {
  return useQuery({
    queryKey: metaKeys.competencias(),
    queryFn: getAvailableCompetencias,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useDashboardSummary(uf: string, competencia: string) {
  return useQuery({
    queryKey: dashboardKeys.summary(uf, competencia),
    queryFn: () => getDashboardSummary(uf, competencia),
    enabled: Boolean(uf && competencia),
  });
}

export function useDashboardKpiPanel(uf: string, competencia: string) {
  return useQuery({
    queryKey: dashboardKeys.kpis(uf, competencia),
    queryFn: () => getDashboardKpiPanel(uf, competencia),
    enabled: Boolean(uf && competencia),
  });
}

export function useTopCountries(uf: string, competencia: string, topN: number) {
  return useQuery({
    queryKey: dashboardKeys.topCountries(uf, competencia, topN),
    queryFn: () => getTopCountries(uf, competencia, topN),
    enabled: Boolean(uf && competencia),
  });
}

export function useSalaryByAgeGender(uf: string, competencia: string) {
  return useQuery({
    queryKey: dashboardKeys.salaryAgeGender(uf, competencia),
    queryFn: () => getSalaryByAgeGender(uf, competencia),
    enabled: Boolean(uf && competencia),
  });
}

export function useSalaryBoxByEducation(uf: string, competencia: string) {
  return useQuery({
    queryKey: dashboardKeys.salaryBox(uf, competencia),
    queryFn: () => getSalaryBoxByEducation(uf, competencia),
    enabled: Boolean(uf && competencia),
  });
}

export function useTreemapSectorCountry(uf: string, competencia: string) {
  return useQuery({
    queryKey: dashboardKeys.treemap(uf, competencia),
    queryFn: () => getTreemapSectorCountry(uf, competencia),
    enabled: Boolean(uf && competencia),
  });
}

export function useTimeseriesSaldo(uf: string) {
  return useQuery({
    queryKey: dashboardKeys.timeseries(uf),
    queryFn: () => getTimeseriesSaldo(uf),
    enabled: Boolean(uf),
  });
}

export function useHeatmapSalarySectorAge(uf: string, competencia: string) {
  return useQuery({
    queryKey: dashboardKeys.heatmap(uf, competencia),
    queryFn: () => getHeatmapSalarySectorAge(uf, competencia),
    enabled: Boolean(uf && competencia),
  });
}

export function useTopMunicipiosMov(uf: string, competencia: string, topN: number) {
  return useQuery({
    queryKey: dashboardKeys.topMunicipios(uf, competencia, topN),
    queryFn: () => getTopMunicipiosMov(uf, competencia, topN),
    enabled: Boolean(uf && competencia),
  });
}

export function useDashboardTable(uf: string, competencia: string, limit = 1000, offset = 0, sort = "saldo_sum:desc") {
  return useQuery({
    queryKey: dashboardKeys.table(uf, competencia, limit, offset, sort),
    queryFn: () => getDashboardTable(uf, competencia, limit, offset, sort),
    enabled: Boolean(uf && competencia),
  });
}

export function useSetMapCompetenciaMutation() {
  return useMutation({
    mutationFn: ({ uf, competenciamov }: { uf: string; competenciamov: string }) => setMapCompetencia(uf, competenciamov),
  });
}
