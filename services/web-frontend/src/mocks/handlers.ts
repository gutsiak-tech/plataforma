import { http, HttpResponse } from "msw";

const API = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";

export const handlers = [
  http.get(`${API}/api/meta/available_ufs`, () => HttpResponse.json(["PR"])),
  http.get(`${API}/api/meta/available_competencias`, () => HttpResponse.json(["2025-01", "2025-02", "2025-03", "2025-04"])),
  http.get(`${API}/api/dashboard/summary`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json({
      uf: url.searchParams.get("uf") ?? "PR",
      competencia: url.searchParams.get("competencia") ?? "2025-04",
      municipio_count: 399,
      total_saldo: 18234,
      min_saldo: -1200,
      max_saldo: 2500,
    });
  }),
  http.get(`${API}/api/dashboard/top_municipios_mov`, () =>
    HttpResponse.json({
      rows: [
        { municipio: "Curitiba", saldo_sum: 2200 },
        { municipio: "Maringa", saldo_sum: 1300 },
        { municipio: "Londrina", saldo_sum: 900 },
      ],
      missing_fields: [],
    })
  ),
  http.get(`${API}/api/dashboard/treemap_sector_country`, () =>
    HttpResponse.json([
      { secao: "Industria", pais: "Venezuela", contagem: 120, salario_medio: 2800 },
      { secao: "Industria", pais: "Haiti", contagem: 80, salario_medio: 2400 },
      { secao: "Comercio", pais: "Paraguai", contagem: 60, salario_medio: 3100 },
      { secao: "Construcao", pais: "Argentina", contagem: 40, salario_medio: 2600 },
    ])
  ),
];
