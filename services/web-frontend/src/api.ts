export {
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
  type EmptyAwareRows,
} from "./lib/api/client";

export type {
  DashboardKpiPanel,
  DashboardSummary,
  DashboardTableRow,
  HeatmapSalarySectorAge,
  SalaryAgeGenderRow,
  SalaryBoxEducationRow,
  TimeseriesSaldoRow,
  TopBottomRow,
  TopCountryRow,
  TreemapSectorCountryRow,
} from "./lib/api/schemas";

const TILES_BASE = import.meta.env.VITE_TILES_URL || "http://localhost:8080";

export function getTilesBase(): string {
  return TILES_BASE;
}
