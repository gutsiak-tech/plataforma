-- Row-level dashboard-serving fact table (loaded from mapped CSV).
-- This enables SQL-side aggregates for all dashboard charts.
CREATE TABLE IF NOT EXISTS internal.fact_caged_dashboard_rows (
    uf TEXT NOT NULL,
    competenciamov TEXT NOT NULL,
    municipio_norm TEXT NOT NULL,
    municipio_raw TEXT,
    pais TEXT,
    continente TEXT,
    secao TEXT,
    categoria TEXT,
    sexo TEXT,
    nivel_instrucao TEXT,
    faixa_etaria TEXT,
    racacor TEXT,
    salario NUMERIC(14, 2),
    saldomovimentacao BIGINT
);

CREATE INDEX IF NOT EXISTS idx_fact_dash_rows_uf_comp
    ON internal.fact_caged_dashboard_rows (uf, competenciamov);
CREATE INDEX IF NOT EXISTS idx_fact_dash_rows_pais
    ON internal.fact_caged_dashboard_rows (uf, competenciamov, pais);
CREATE INDEX IF NOT EXISTS idx_fact_dash_rows_secao_faixa
    ON internal.fact_caged_dashboard_rows (uf, competenciamov, secao, faixa_etaria);
CREATE INDEX IF NOT EXISTS idx_fact_dash_rows_municipio
    ON internal.fact_caged_dashboard_rows (uf, competenciamov, municipio_norm);
