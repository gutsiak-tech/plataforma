-- public_api.vw_caged_municipio_mes: join geo + fact (all competencias)
CREATE OR REPLACE VIEW public_api.vw_caged_municipio_mes AS
SELECT
    g.uf,
    f.competenciamov,
    g.municipio_norm AS municipio,
    COALESCE(f.saldo_sum, 0) AS saldo_sum,
    g.geom
FROM internal.geo_municipios g
LEFT JOIN internal.fact_caged_municipio_mes f
    ON g.uf = f.uf AND g.municipio_norm = f.municipio_norm;

-- View for current layer: geo joined with fact for current_competencia
CREATE OR REPLACE VIEW public_api.vw_current_caged_layer AS
SELECT
    g.uf,
    g.municipio_norm AS municipio,
    g.municipio_raw,
    g.geom,
    c.competenciamov,
    COALESCE(f.saldo_sum, 0) AS saldo_sum
FROM internal.geo_municipios g
CROSS JOIN internal.current_competencia c
LEFT JOIN internal.fact_caged_municipio_mes f
    ON g.uf = f.uf AND g.municipio_norm = f.municipio_norm
    AND f.competenciamov = c.competenciamov;

-- Materialized view for Tegola (fast tile serving). gid for Tegola tile layer id.
DROP MATERIALIZED VIEW IF EXISTS internal.mv_current_caged_layer;
CREATE MATERIALIZED VIEW internal.mv_current_caged_layer AS
SELECT
    row_number() OVER ()::integer AS gid,
    g.uf,
    g.municipio_norm AS municipio,
    COALESCE(g.municipio_raw, g.municipio_norm) AS municipio_display,
    g.geom,
    c.competenciamov,
    COALESCE(f.saldo_sum, 0) AS saldo_sum
FROM internal.geo_municipios g
CROSS JOIN internal.current_competencia c
LEFT JOIN internal.fact_caged_municipio_mes f
    ON g.uf = f.uf AND g.municipio_norm = f.municipio_norm
    AND f.competenciamov = c.competenciamov;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_current_caged_gid
    ON internal.mv_current_caged_layer (gid);
CREATE INDEX IF NOT EXISTS idx_mv_current_caged_geom
    ON internal.mv_current_caged_layer USING GIST (geom);

-- public_api.vw_dashboard_summary: aggregates by uf + competenciamov
CREATE OR REPLACE VIEW public_api.vw_dashboard_summary AS
SELECT
    uf,
    competenciamov,
    COUNT(*) AS municipio_count,
    SUM(saldo_sum) AS total_saldo,
    MIN(saldo_sum) AS min_saldo,
    MAX(saldo_sum) AS max_saldo
FROM internal.fact_caged_municipio_mes
GROUP BY uf, competenciamov;
