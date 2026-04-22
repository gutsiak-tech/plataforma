import type {
  HeatmapSalarySectorAge,
  SalaryAgeGenderRow,
  SalaryBoxEducationRow,
  TimeseriesSaldoRow,
  TopBottomRow,
  TopCountryRow,
} from "../../../lib/api/schemas";
import type { EmptyAwareRows } from "../../../lib/api/client";
import { educationLabelInfo, faixaEtariaOrder, normalizeText } from "./chartHelpers";

export function buildTopCountriesOption(topCountries: EmptyAwareRows<TopCountryRow> | null) {
  const sortedRows = [...(topCountries?.rows ?? [])].sort((a, b) => b.total - a.total);
  return {
    darkMode: true,
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "value",
      axisLabel: { color: "#334155" },
      splitLine: { lineStyle: { color: "rgba(51,65,85,0.12)" } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: sortedRows.map((r) => r.pais),
      axisLabel: { color: "#334155" },
    },
    series: [{ type: "bar", data: sortedRows.map((r) => r.total), itemStyle: { color: "#86efac" } }],
    grid: { left: 100, right: 16, top: 16, bottom: 16 },
  };
}

export function buildAgeGenderOption(salaryByAgeGender: EmptyAwareRows<SalaryAgeGenderRow> | null) {
  const rows = salaryByAgeGender?.rows ?? [];
  const sexes = [...new Set(rows.map((r) => r.sexo))];
  const faixas = [...new Set(rows.map((r) => r.faixa_etaria))].sort(
    (a, b) => faixaEtariaOrder(a) - faixaEtariaOrder(b) || a.localeCompare(b)
  );
  return {
    darkMode: true,
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: number | string) => `R$ ${Number(value).toLocaleString("pt-BR")}`,
    },
    legend: {
      data: sexes,
      left: "center",
      bottom: 6,
      orient: "horizontal",
      textStyle: { color: "#334155" },
    },
    xAxis: {
      type: "category",
      data: faixas,
      axisLabel: { color: "#334155", interval: 0, rotate: 16, hideOverlap: true },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#334155",
        formatter: (value: number) => `R$ ${value.toLocaleString("pt-BR")}`,
      },
      splitLine: { lineStyle: { color: "rgba(51,65,85,0.12)" } },
    },
    series: sexes.map((sexo) => ({
      type: "bar",
      name: sexo,
      data: faixas.map((faixa) => {
        const salario = rows.find((r) => r.sexo === sexo && r.faixa_etaria === faixa)?.salario_medio ?? 0;
        return Math.ceil(salario);
      }),
      itemStyle: {
        color: /feminino/i.test(sexo) ? "#93c5fd" : "#86efac",
      },
    })),
    grid: { left: 56, right: 16, top: 24, bottom: 110, containLabel: true },
  };
}

export function buildBoxOption(salaryBoxByEducation: EmptyAwareRows<SalaryBoxEducationRow> | null) {
  const rows = (salaryBoxByEducation?.rows ?? [])
    .map((row) => {
      const { order, shortLabel } = educationLabelInfo(row.nivel_instrucao);
      return { ...row, order, shortLabel };
    })
    .sort((a, b) => a.order - b.order || a.nivel_instrucao.localeCompare(b.nivel_instrucao));

  const postgraduateIndex = rows.findIndex((row) => normalizeText(row.nivel_instrucao).includes("pos"));
  return {
    darkMode: false,
    backgroundColor: "transparent",
    textStyle: { fontFamily: "Open Sans, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", color: "#0f172a" },
    tooltip: {
      trigger: "item",
      backgroundColor: "#ffffff",
      borderColor: "#cbd5e1",
      borderWidth: 1,
      textStyle: { color: "#0f172a" },
      formatter: (params: { dataIndex?: number }) => {
        const index = params.dataIndex ?? 0;
        const row = rows[index];
        if (!row) return "";
        return [
          `<b>${row.nivel_instrucao}</b>`,
          `N: ${row.total.toLocaleString("pt-BR")}`,
          `Mínimo: R$ ${Math.round(row.min_salary).toLocaleString("pt-BR")}`,
          `Q1: R$ ${Math.round(row.q1_salary).toLocaleString("pt-BR")}`,
          `Mediana: R$ ${Math.round(row.median_salary).toLocaleString("pt-BR")}`,
          `Q3: R$ ${Math.round(row.q3_salary).toLocaleString("pt-BR")}`,
          `Máximo: R$ ${Math.round(row.max_salary).toLocaleString("pt-BR")}`,
        ].join("<br/>");
      },
    },
    xAxis: {
      type: "category",
      data: rows.map((r) => r.shortLabel),
      axisTick: { alignWithLabel: true },
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: {
        color: "#334155",
        interval: 0,
        rotate: 0,
        lineHeight: 16,
        fontSize: 12,
        margin: 14,
        hideOverlap: false,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#334155",
        formatter: (value: number) => `R$ ${Math.round(value).toLocaleString("pt-BR")}`,
      },
      splitLine: {
        show: true,
        lineStyle: { color: "rgba(51,65,85,0.12)", width: 1 },
      },
    },
    series: [
      {
        type: "boxplot",
        data: rows.map((r) => [r.min_salary, r.q1_salary, r.median_salary, r.q3_salary, r.max_salary]),
        boxWidth: ["35%", "55%"],
        itemStyle: {
          color: "rgba(2, 132, 199, 0.62)",
          borderColor: "#075985",
          borderWidth: 1.8,
        },
        lineStyle: {
          color: "#0c4a6e",
          width: 1.8,
        },
      },
      {
        type: "scatter",
        data: rows.map((r, i) => [i, r.median_salary]),
        symbol: "circle",
        symbolSize: 9,
        itemStyle: {
          color: "#b91c1c",
          borderColor: "#7f1d1d",
          borderWidth: 1.2,
        },
        tooltip: { show: false },
        z: 4,
        silent: true,
      },
    ],
    visualMap:
      postgraduateIndex >= 0
        ? {
            show: false,
            dimension: 0,
            pieces: [{ value: postgraduateIndex, color: "rgba(245, 158, 11, 0.76)" }],
            outOfRange: { color: "rgba(2, 132, 199, 0.62)" },
            seriesIndex: 0,
          }
        : undefined,
    grid: { left: 84, right: 22, top: 24, bottom: 78 },
  };
}

export function buildSeriesOption(timeseriesSaldo: EmptyAwareRows<TimeseriesSaldoRow> | null) {
  return {
    darkMode: true,
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: (timeseriesSaldo?.rows ?? []).map((r) => r.competenciamov),
      axisLabel: { color: "#334155" },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#334155" },
      splitLine: { lineStyle: { color: "rgba(51,65,85,0.12)" } },
    },
    series: [{ type: "line", smooth: true, data: (timeseriesSaldo?.rows ?? []).map((r) => r.saldo_sum), areaStyle: {} }],
    grid: { left: 56, right: 16, top: 20, bottom: 32 },
  };
}

export function buildHeatmapOption(heatmapSalarySectorAge: HeatmapSalarySectorAge | null) {
  const cols = heatmapSalarySectorAge?.cols ?? [];
  const rows = heatmapSalarySectorAge?.rows ?? [];
  const values = heatmapSalarySectorAge?.values ?? [];
  const sortedColIndexes = cols
    .map((label, index) => ({ label, index, order: faixaEtariaOrder(label) }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map((item) => item.index);
  const sortedCols = sortedColIndexes.map((idx) => cols[idx]);
  const sortedValues = values.map((row) => sortedColIndexes.map((idx) => row[idx]));

  return {
    darkMode: true,
    backgroundColor: "transparent",
    tooltip: { position: "top" },
    xAxis: {
      type: "category",
      data: sortedCols,
      axisLabel: { color: "#334155", rotate: 20 },
    },
    yAxis: { type: "category", data: rows, axisLabel: { color: "#334155" } },
    visualMap: {
      min: 0,
      max: 5000,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 14,
      textStyle: { color: "#334155" },
    },
    series: [
      {
        type: "heatmap",
        data: sortedValues.flatMap((row, i) => row.map((value, j) => [j, i, value ?? 0])) ?? [],
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,0.3)" } },
      },
    ],
    grid: { left: 100, right: 16, top: 20, bottom: 92 },
  };
}

export function buildTopMunicipiosOption(topMunicipiosMov: EmptyAwareRows<TopBottomRow> | null) {
  const sortedRows = [...(topMunicipiosMov?.rows ?? [])].sort((a, b) => b.saldo_sum - a.saldo_sum);
  return {
    darkMode: true,
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "value",
      axisLabel: { color: "#334155" },
      splitLine: { lineStyle: { color: "rgba(51,65,85,0.12)" } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: sortedRows.map((r) => r.municipio),
      axisLabel: { color: "#334155" },
    },
    series: [{ type: "bar", data: sortedRows.map((r) => r.saldo_sum), itemStyle: { color: "#38bdf8" } }],
    grid: { left: 140, right: 16, top: 20, bottom: 20 },
  };
}

export function buildTreemapOption(treemapData: Array<Record<string, unknown>> | undefined, treemapScale: { min: number; max: number }) {
  return {
    darkMode: true,
    backgroundColor: "transparent",
    tooltip: {
      formatter: (info: { name: string; value: number | number[]; data: { salario?: number | null; secao?: string } }) => {
        const freq = Array.isArray(info.value) ? info.value[0] : info.value;
        const salarioVal = info.data?.salario;
        const salarioStr =
          salarioVal == null || !Number.isFinite(salarioVal)
            ? "Não informado na base RAIS"
            : `R$ ${Number(salarioVal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        const secao = info.data?.secao;
        const titulo = secao && secao !== info.name ? `${secao} › ${info.name}` : info.name;
        return `${titulo}<br/>Frequência: ${Number(freq).toLocaleString("pt-BR")}<br/>Salário médio: ${salarioStr}`;
      },
    },
    visualMap: {
      show: false,
      type: "continuous",
      min: Number(treemapScale.min),
      max: Number(treemapScale.max),
      dimension: 1,
      seriesIndex: 0,
      calculable: false,
      realtime: false,
      precision: 0,
      inRange: { color: ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"] },
      outOfRange: { color: ["#334155"] },
      formatter: (value: number) => `R$ ${Math.round(value).toLocaleString("pt-BR")}`,
    },
    series: [
      {
        type: "treemap",
        roam: false,
        nodeClick: false,
        leafDepth: 2,
        visualDimension: 1,
        colorMappingBy: "value",
        visibleMin: 1,
        sort: "desc",
        breadcrumb: { show: false },
        label: {
          color: "#e2e8f0",
          overflow: "truncate",
          fontSize: 12,
          formatter: "{b}",
        },
        upperLabel: { show: false },
        levels: [
          {
            itemStyle: {
              borderColor: "#334155",
              borderWidth: 1,
              gapWidth: 1,
            },
            upperLabel: { show: false },
          },
          {
            itemStyle: {
              borderColor: "#334155",
              borderWidth: 1,
              gapWidth: 1,
            },
            label: {
              show: true,
              color: "#e2e8f0",
            },
          },
        ],
        data: treemapData,
      },
    ],
  };
}
