import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FilterBar, type FilterState } from "../components/FilterBar";
import { filterStateFromSearchParams } from "../lib/filterFromUrl";
import { DashboardCharts } from "../features/dashboard/charts/DashboardCharts";
import { DashboardDataTable } from "../features/dashboard/DashboardDataTable";
import { EmptyState } from "../components/common/EmptyState";
import { KpiCard } from "../components/KPICard";
import { ErrorPanel } from "../components/common/ErrorPanel";
import { Skeleton } from "../components/common/Skeleton";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { PageShell } from "../components/layout/PageShell";
import { TopNav } from "../components/layout/TopNav";
import { useDashboardData } from "../hooks/useDashboardData";

function brNumber(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR");
}

function brCurrency(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = filterStateFromSearchParams(searchParams);
  const [topCountriesN, setTopCountriesN] = useState(10);
  const [topMunicipiosN, setTopMunicipiosN] = useState(10);
  const [showTable, setShowTable] = useState(false);
  const tableSectionRef = useRef<HTMLDivElement>(null);

  const {
    loading,
    error,
    kpis,
    topCountries,
    salaryByAgeGender,
    salaryBoxByEducation,
    treemapSectorCountry,
    timeseriesSaldo,
    heatmapSalarySectorAge,
    topMunicipiosMov,
    tableRows,
  } = useDashboardData(filter.uf, filter.competencia, topCountriesN, topMunicipiosN);

  useEffect(() => {
    const prevRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => {
      history.scrollRestoration = prevRestoration;
    };
  }, []);

  useEffect(() => {
    if (showTable && tableSectionRef.current) {
      const el = tableSectionRef.current;
      // Defer scroll until table has rendered and layout is complete
      const id = setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return () => clearTimeout(id);
    }
  }, [showTable]);

  const updateFilter = useCallback((next: FilterState) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set("uf", next.uf);
        if (next.competencia) {
          p.set("competencia", next.competencia);
        } else {
          p.delete("competencia");
        }
        return p;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <TopNav uf={filter.uf} competencia={filter.competencia} />
      <div className="pt-16">
        <PageShell>
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative left-1/2 -mt-6 w-screen -translate-x-1/2 bg-[#dbeafe] md:-mt-8">
            <div className="mx-auto w-full max-w-[1360px] space-y-6 px-4 py-6 md:px-8 md:py-8">
              <section className="space-y-1">
                <h1 className="text-4xl font-bold tracking-tight text-[var(--dashboard-text)] md:text-5xl">
                  Plataforma de Inteligência Migratória
                </h1>
                <p className="text-base text-[var(--dashboard-muted)] md:text-lg">
                  Plataforma de acesso a dados migratórios do estado do Paraná
                </p>
              </section>

              <section className="rounded-[var(--dashboard-radius-card)] border border-[var(--dashboard-border)] bg-[var(--dashboard-card)] p-4 shadow-[0_14px_32px_rgba(15,23,42,0.032)] md:p-5">
                <FilterBar
                  value={filter}
                  onChange={updateFilter}
                  inline
                  className="space-y-0"
                  extraControls={
                    <>
                      <div className="min-w-[150px] flex-1 space-y-1 md:max-w-[180px]">
                        <label className="text-xs font-semibold text-[var(--dashboard-muted)]">Top N Países</label>
                        <Input
                          type="number"
                          min={5}
                          max={20}
                          value={topCountriesN}
                          onChange={(e) => setTopCountriesN(Math.max(5, Math.min(20, Number(e.target.value) || 10)))}
                          className="h-10 rounded-[var(--dashboard-radius-input)] border-[var(--dashboard-border)] bg-white text-[var(--dashboard-text)]"
                        />
                      </div>
                      <div className="min-w-[170px] flex-1 space-y-1 md:max-w-[210px]">
                        <label className="text-xs font-semibold text-[var(--dashboard-muted)]">Top N Municípios</label>
                        <Input
                          type="number"
                          min={5}
                          max={25}
                          value={topMunicipiosN}
                          onChange={(e) => setTopMunicipiosN(Math.max(5, Math.min(25, Number(e.target.value) || 10)))}
                          className="h-10 rounded-[var(--dashboard-radius-input)] border-[var(--dashboard-border)] bg-white text-[var(--dashboard-text)]"
                        />
                      </div>
                    </>
                  }
                />
              </section>

              {error ? <ErrorPanel message={error} /> : null}
              {loading ? <Skeleton className="h-10 w-64" /> : null}
            </div>
          </div>

          <section className="grid grid-cols-1 gap-x-10 gap-y-8 py-10 md:grid-cols-2 md:py-12">
            <KpiCard
              title="Total registros"
              subtitle="Total de vínculos considerados no recorte atual."
              value={brNumber(kpis?.total_records)}
              kind="total"
            />
            <KpiCard
              title="Salário médio (R$)"
              subtitle="Remuneração média mensal observada no período selecionado."
              value={brCurrency(kpis?.salary_mean)}
              kind="mean"
            />
            <KpiCard
              title="Salário mediano (R$)"
              subtitle="Valor central da distribuição salarial da amostra."
              value={brCurrency(kpis?.salary_median)}
              kind="median"
            />
            <KpiCard
              title="Salário P90 (R$)"
              subtitle="Faixa salarial de referência dos 10% maiores salários."
              value={brCurrency(kpis?.salary_p90)}
              kind="p90"
            />
            <KpiCard
              title="Número de países"
              subtitle="Quantidade de nacionalidades presentes nos registros."
              value={brNumber(kpis?.countries_count)}
              kind="countries"
            />
          </section>

          {kpis && kpis.missing_fields.length > 0 ? (
            <EmptyState
              title="KPIs com dados parciais"
              message="Alguns indicadores foram calculados com informação incompleta."
              missingFields={kpis.missing_fields}
            />
          ) : null}

          <DashboardCharts
            topCountries={topCountries}
            salaryByAgeGender={salaryByAgeGender}
            salaryBoxByEducation={salaryBoxByEducation}
            treemapSectorCountry={treemapSectorCountry}
            timeseriesSaldo={timeseriesSaldo}
            heatmapSalarySectorAge={heatmapSalarySectorAge}
            topMunicipiosMov={topMunicipiosMov}
          />

          <section ref={tableSectionRef} className="space-y-3">
            <Button
              variant="secondary"
              onClick={() => setShowTable((v) => !v)}
              type="button"
              className="bg-violet-500 font-semibold text-white hover:bg-violet-600 border-violet-500"
            >
              {showTable ? "Ocultar tabela (amostra)" : "Ver tabela (amostra DB)"}
            </Button>
            {showTable && (
              <div className="rounded-[var(--dashboard-radius-card)] border border-[var(--dashboard-border)] bg-[var(--dashboard-card)] p-4 shadow-[0_14px_32px_rgba(15,23,42,0.032)]">
                <p className="mb-2 text-sm font-semibold text-[var(--dashboard-text)]">
                  Tabela — {filter.uf} {filter.competencia ? `| ${filter.competencia}` : ""}
                </p>
                <DashboardDataTable tableRows={tableRows} />
              </div>
            )}
          </section>
        </motion.div>
      </PageShell>
      </div>
    </div>
  );
}

