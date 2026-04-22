import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  HeatmapSalarySectorAge,
  SalaryAgeGenderRow,
  SalaryBoxEducationRow,
  TimeseriesSaldoRow,
  TopBottomRow,
  TopCountryRow,
  TreemapSectorCountryRow,
} from "../../../lib/api/schemas";
import type { EmptyAwareRows } from "../../../lib/api/client";
import { ChartCard } from "./ChartCard";
import { ChartRenderer } from "./ChartRenderer";
import { ColorScaleControls } from "./ColorScaleControls";
import { FullscreenChartModal } from "./FullscreenChartModal";
import { EmptyState } from "../../../components/common/EmptyState";
import {
  buildAgeGenderOption,
  buildBoxOption,
  buildHeatmapOption,
  buildSeriesOption,
  buildTopCountriesOption,
  buildTopMunicipiosOption,
  buildTreemapOption,
} from "./chartOptions";
import { prepareTreemap } from "./treemap";

interface DashboardChartsProps {
  topCountries: EmptyAwareRows<TopCountryRow> | null;
  salaryByAgeGender: EmptyAwareRows<SalaryAgeGenderRow> | null;
  salaryBoxByEducation: EmptyAwareRows<SalaryBoxEducationRow> | null;
  treemapSectorCountry: TreemapSectorCountryRow[] | null;
  timeseriesSaldo: EmptyAwareRows<TimeseriesSaldoRow> | null;
  heatmapSalarySectorAge: HeatmapSalarySectorAge | null;
  topMunicipiosMov: EmptyAwareRows<TopBottomRow> | null;
}

type ExpandedChartId =
  | "topCountries"
  | "ageGender"
  | "salaryEducation"
  | "treemap"
  | "timeseries"
  | "heatmap"
  | "topMunicipios";

export function DashboardCharts({
  topCountries,
  salaryByAgeGender,
  salaryBoxByEducation,
  treemapSectorCountry,
  timeseriesSaldo,
  heatmapSalarySectorAge,
  topMunicipiosMov,
}: DashboardChartsProps) {
  const [treemapError, setTreemapError] = useState("");
  const [treemapAdvancedEnabled, setTreemapAdvancedEnabled] = useState(false);
  const [treemapScaleMode, setTreemapScaleMode] = useState<"global" | "robust" | "custom">("robust");
  const [treemapCustomRange, setTreemapCustomRange] = useState<{ min: number; max: number } | null>(null);
  const [expandedChartId, setExpandedChartId] = useState<ExpandedChartId | null>(null);
  const [expandTrigger, setExpandTrigger] = useState<HTMLButtonElement | null>(null);
  const mockEnabled = import.meta.env.VITE_TREEMAP_MOCK === "1";

  const handleExpand = (chartId: string, trigger: HTMLButtonElement) => {
    setExpandedChartId(chartId as ExpandedChartId);
    setExpandTrigger(trigger);
  };

  const handleCloseExpanded = () => {
    setExpandedChartId(null);
  };

  const treemapPrepared = useMemo(() => prepareTreemap(treemapSectorCountry, mockEnabled), [mockEnabled, treemapSectorCountry]);

  useEffect(() => {
    if (typeof treemapPrepared.robustMin === "number" && typeof treemapPrepared.robustMax === "number") {
      setTreemapCustomRange({ min: treemapPrepared.robustMin as number, max: treemapPrepared.robustMax as number });
    }
  }, [treemapPrepared.robustMax, treemapPrepared.robustMin]);

  const treemapScale = useMemo(() => {
    const globalMin = Number(treemapPrepared.globalMin ?? 0);
    const globalMax = Number(treemapPrepared.globalMax ?? 1);
    const robustMin = Number(treemapPrepared.robustMin ?? globalMin);
    const robustMax = Number(treemapPrepared.robustMax ?? globalMax);
    if (!treemapAdvancedEnabled) {
      return { min: robustMin, max: robustMax };
    }
    if (treemapScaleMode === "global") {
      return { min: globalMin, max: globalMax };
    }
    if (treemapScaleMode === "robust") {
      return { min: robustMin, max: robustMax };
    }
    const customMin = Number(treemapCustomRange?.min ?? robustMin);
    const customMax = Number(treemapCustomRange?.max ?? robustMax);
    return {
      min: Math.min(customMin, customMax - 1),
      max: Math.max(customMax, customMin + 1),
    };
  }, [
    treemapAdvancedEnabled,
    treemapCustomRange?.max,
    treemapCustomRange?.min,
    treemapPrepared.globalMax,
    treemapPrepared.globalMin,
    treemapPrepared.robustMax,
    treemapPrepared.robustMin,
    treemapScaleMode,
  ]);

  const topCountriesOption = useMemo(() => buildTopCountriesOption(topCountries), [topCountries]);
  const ageGenderOption = useMemo(() => buildAgeGenderOption(salaryByAgeGender), [salaryByAgeGender]);
  const boxOption = useMemo(() => buildBoxOption(salaryBoxByEducation), [salaryBoxByEducation]);
  const seriesOption = useMemo(() => buildSeriesOption(timeseriesSaldo), [timeseriesSaldo]);
  const heatmapOption = useMemo(() => buildHeatmapOption(heatmapSalarySectorAge), [heatmapSalarySectorAge]);
  const topMunicipiosOption = useMemo(() => buildTopMunicipiosOption(topMunicipiosMov), [topMunicipiosMov]);
  const treemapOption = useMemo(
    () => buildTreemapOption(treemapPrepared.data, treemapScale),
    [treemapPrepared.data, treemapScale.max, treemapScale.min]
  );

  const expandedChartMeta: Record<ExpandedChartId, { title: string; subtitle?: string }> = {
    topCountries: {
      title: "Principais países de origem por frequência — Paraná, 2025",
      subtitle: "Ranking de registros por país de origem (dados RAIS).",
    },
    ageGender: {
      title: "Salário médio por faixa etária e sexo — Paraná, 2025",
      subtitle: "Comparativo de remuneração mensal por grupos etários e sexo (dados RAIS).",
    },
    salaryEducation: {
      title: "Distribuição salarial por nível de instrução — Paraná, 2025",
      subtitle: "Salários mensais em reais brasileiros (dados RAIS)",
    },
    treemap: {
      title: "Distribuição setorial por país (treemap) — Paraná, 2025",
      subtitle: mockEnabled
        ? "Participação de vínculos por setor e país de origem (dados RAIS) — Modo mock ativo."
        : "Participação de vínculos por setor e país de origem (dados RAIS).",
    },
    timeseries: {
      title: "Evolução temporal do saldo de movimentação — Paraná",
      subtitle: "Série histórica do saldo líquido de movimentações no período (dados RAIS).",
    },
    heatmap: {
      title: "Matriz salarial por setor e faixa etária — Paraná, 2025",
      subtitle: "Heatmap do salário médio mensal por setor econômico e faixa etária (dados RAIS).",
    },
    topMunicipios: {
      title: "Municípios com maior movimentação líquida — Paraná, 2025",
      subtitle: "Ranking municipal por saldo líquido de movimentações (dados RAIS).",
    },
  };

  const expandedChartContent: ReactNode = useMemo(() => {
    if (!expandedChartId) return null;
    if (expandedChartId === "topCountries") return <ChartRenderer option={topCountriesOption} onError={() => undefined} height={620} />;
    if (expandedChartId === "ageGender") return <ChartRenderer option={ageGenderOption} onError={() => undefined} height={620} />;
    if (expandedChartId === "salaryEducation") return <ChartRenderer option={boxOption} onError={() => undefined} height={620} />;
    if (expandedChartId === "treemap") return <ChartRenderer option={treemapOption} onError={setTreemapError} height={620} />;
    if (expandedChartId === "timeseries") return <ChartRenderer option={seriesOption} onError={() => undefined} height={620} />;
    if (expandedChartId === "heatmap") return <ChartRenderer option={heatmapOption} onError={() => undefined} height={620} />;
    if (expandedChartId === "topMunicipios") return <ChartRenderer option={topMunicipiosOption} onError={() => undefined} height={620} />;
    return null;
  }, [
    ageGenderOption,
    boxOption,
    expandedChartId,
    heatmapOption,
    seriesOption,
    topCountriesOption,
    topMunicipiosOption,
    treemapOption,
  ]);

  const activeExpandedMeta = expandedChartId ? expandedChartMeta[expandedChartId] : null;

  return (
    <>
      <div className="space-y-0">
        <section className="relative left-1/2 w-screen -translate-x-1/2 bg-white py-6 md:py-8">
          <div className="mx-auto w-full max-w-[1360px] space-y-4 px-4 md:px-8">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--dashboard-text)] md:text-3xl">Movimentações migratórias</h2>
            <p className="text-sm text-[var(--dashboard-muted)]">Panorama de origem, saldo e concentração municipal dos fluxos.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              chartId="topCountries"
              title="Principais países de origem por frequência — Paraná, 2025"
              subtitle="Ranking de registros por país de origem (dados RAIS)."
              onExpand={handleExpand}
              loading={!topCountries}
              empty={
                topCountries && topCountries.rows.length === 0
                  ? {
                      title: "Sem dados para Top Países",
                      message: "Não há linhas após os filtros atuais.",
                      missingFields: topCountries.missing_fields,
                    }
                  : null
              }
            >
              <ChartRenderer option={topCountriesOption} onError={() => undefined} />
              <p className="mt-2 text-xs text-slate-600">Fonte: RAIS 2025. Elaboração do autor.</p>
            </ChartCard>
            <ChartCard
              chartId="topMunicipios"
              title="Municípios com maior movimentação líquida — Paraná, 2025"
              subtitle="Ranking municipal por saldo líquido de movimentações (dados RAIS)."
              onExpand={handleExpand}
              loading={!topMunicipiosMov}
              empty={
                topMunicipiosMov && topMunicipiosMov.rows.length === 0
                  ? {
                      title: "Sem dados para top municípios",
                      message: "Não há linhas para ranking municipal.",
                      missingFields: topMunicipiosMov.missing_fields,
                    }
                  : null
              }
            >
              <ChartRenderer option={topMunicipiosOption} onError={() => undefined} />
              <p className="mt-2 text-xs text-slate-600">Fonte: RAIS 2025. Elaboração do autor.</p>
            </ChartCard>
            <div className="xl:col-span-2">
              <ChartCard
                chartId="timeseries"
                title="Evolução temporal do saldo de movimentação — Paraná"
                subtitle="Série histórica do saldo líquido de movimentações no período (dados RAIS)."
                onExpand={handleExpand}
                loading={!timeseriesSaldo}
                empty={
                  timeseriesSaldo && timeseriesSaldo.rows.length === 0
                    ? {
                        title: "Sem dados para série temporal",
                        message: "Não há competências suficientes para construir a série.",
                        missingFields: timeseriesSaldo.missing_fields,
                      }
                    : null
                }
              >
                <ChartRenderer option={seriesOption} onError={() => undefined} />
                <p className="mt-2 text-xs text-slate-600">Fonte: RAIS 2025. Elaboração do autor.</p>
              </ChartCard>
            </div>
          </div>
          </div>
        </section>

        <section className="relative left-1/2 w-screen -translate-x-1/2 bg-[#eef0f3] py-6 md:py-8">
          <div className="mx-auto w-full max-w-[1360px] space-y-4 px-4 md:px-8">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--dashboard-text)] md:text-3xl">Perfil socioeconômico</h2>
            <p className="text-sm text-[var(--dashboard-muted)]">Indicadores de remuneração por sexo, instrução e faixa etária.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              chartId="ageGender"
              title="Salário médio por faixa etária e sexo — Paraná, 2025"
              subtitle="Comparativo de remuneração mensal por grupos etários e sexo (dados RAIS)."
              onExpand={handleExpand}
              loading={!salaryByAgeGender}
              empty={
                salaryByAgeGender && salaryByAgeGender.rows.length === 0
                  ? {
                      title: "Sem dados para Faixa Etária × Sexo",
                      message: "Dados insuficientes para calcular salário médio por dimensão.",
                      missingFields: salaryByAgeGender.missing_fields,
                    }
                  : null
              }
            >
              <ChartRenderer option={ageGenderOption} onError={() => undefined} height={390} />
              <p className="mt-2 text-xs text-slate-600">Fonte: RAIS 2025. Elaboração do autor.</p>
            </ChartCard>
            <ChartCard
              chartId="salaryEducation"
              title="Distribuição salarial por nível de instrução — Paraná, 2025"
              subtitle="Salários mensais em reais brasileiros (dados RAIS)"
              onExpand={handleExpand}
              loading={!salaryBoxByEducation}
              empty={
                salaryBoxByEducation && salaryBoxByEducation.rows.length === 0
                  ? {
                      title: "Sem dados para boxplot",
                      message: "Não foi possível calcular estatísticas de distribuição salarial.",
                      missingFields: salaryBoxByEducation.missing_fields,
                    }
                  : null
              }
            >
              <ChartRenderer option={boxOption} onError={() => undefined} />
              <p className="mt-2 text-xs text-slate-600">Fonte: RAIS 2025. Elaboração do autor.</p>
            </ChartCard>
            <div className="xl:col-span-2">
              <ChartCard
                chartId="heatmap"
                title="Matriz salarial por setor e faixa etária — Paraná, 2025"
                subtitle="Heatmap do salário médio mensal por setor econômico e faixa etária (dados RAIS)."
                onExpand={handleExpand}
                loading={!heatmapSalarySectorAge}
                empty={
                  heatmapSalarySectorAge &&
                  (heatmapSalarySectorAge.rows.length === 0 || heatmapSalarySectorAge.cols.length === 0)
                    ? {
                        title: "Sem dados para heatmap",
                        message: "Não foi possível construir a matriz setor × faixa etária.",
                        missingFields: heatmapSalarySectorAge.missing_fields,
                      }
                    : null
                }
              >
                <ChartRenderer option={heatmapOption} onError={() => undefined} />
                <p className="mt-2 text-xs text-slate-600">Fonte: RAIS 2025. Elaboração do autor.</p>
              </ChartCard>
            </div>
          </div>
          </div>
        </section>

        <section className="relative left-1/2 w-screen -translate-x-1/2 bg-white py-6 md:py-8">
          <div className="mx-auto w-full max-w-[1360px] space-y-4 px-4 md:px-8">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--dashboard-text)] md:text-3xl">Perfil setorial</h2>
            <p className="text-sm text-[var(--dashboard-muted)]">Distribuição de vínculos por setor econômico e país de origem.</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <ChartCard
              chartId="treemap"
              title="Distribuição setorial por país (treemap) — Paraná, 2025"
              headerExtra={
                <div className="mr-1 inline-flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--dashboard-muted)]">Advanced color scale</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={treemapAdvancedEnabled}
                    aria-label="Advanced color scale"
                    onClick={() => setTreemapAdvancedEnabled((prev) => !prev)}
                    className={`focus-ring relative inline-flex h-5 w-10 items-center rounded-full transition ${
                      treemapAdvancedEnabled ? "bg-[var(--dashboard-primary)]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                        treemapAdvancedEnabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              }
              subtitle={
                mockEnabled
                  ? "Participação de vínculos por setor e país de origem (dados RAIS) — Modo mock ativo."
                  : "Participação de vínculos por setor e país de origem (dados RAIS)."
              }
              onExpand={handleExpand}
              loading={!mockEnabled && !treemapSectorCountry}
              error={treemapPrepared.error || treemapError}
              empty={
                !treemapPrepared.error && treemapPrepared.empty
                  ? {
                      title: "Sem dados para treemap",
                      message: treemapPrepared.empty,
                    }
                  : null
              }
            >
              {treemapPrepared.salaryMissing ? (
                <EmptyState
                  title="Salário médio ausente"
                  message="Treemap renderizado por frequência com cor neutra porque salario_medio está ausente."
                />
              ) : null}
              {!treemapPrepared.salaryMissing &&
              typeof treemapPrepared.globalMin === "number" &&
              typeof treemapPrepared.globalMax === "number" &&
              typeof treemapPrepared.robustMin === "number" &&
              typeof treemapPrepared.robustMax === "number" &&
              treemapCustomRange ? (
                <ColorScaleControls
                  showToggle={false}
                  advancedEnabled={treemapAdvancedEnabled}
                  onAdvancedEnabledChange={setTreemapAdvancedEnabled}
                  scaleMode={treemapScaleMode}
                  onScaleModeChange={setTreemapScaleMode}
                  globalMin={Number(treemapPrepared.globalMin)}
                  globalMax={Number(treemapPrepared.globalMax)}
                  robustMin={Number(treemapPrepared.robustMin)}
                  robustMax={Number(treemapPrepared.robustMax)}
                  customMin={treemapCustomRange.min}
                  customMax={treemapCustomRange.max}
                  onCustomRangeChange={setTreemapCustomRange}
                  activeMin={treemapScale.min}
                  activeMax={treemapScale.max}
                />
              ) : null}
              <ChartRenderer onError={setTreemapError} option={treemapOption} height={480} />
              <p className="mt-2 text-xs text-slate-600">Fonte: RAIS 2025. Elaboração do autor.</p>
            </ChartCard>
          </div>
          </div>
        </section>
      </div>
      <FullscreenChartModal
        isOpen={Boolean(expandedChartId)}
        title={activeExpandedMeta?.title ?? "Chart"}
        subtitle={activeExpandedMeta?.subtitle}
        onClose={handleCloseExpanded}
        returnFocusTo={expandTrigger}
      >
        {expandedChartContent}
      </FullscreenChartModal>
    </>
  );
}
