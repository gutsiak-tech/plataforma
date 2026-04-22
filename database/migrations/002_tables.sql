-- internal.geo_municipios: municipality boundaries from shapefile
CREATE TABLE IF NOT EXISTS internal.geo_municipios (
    uf TEXT NOT NULL,
    municipio_norm TEXT NOT NULL,
    municipio_raw TEXT,
    geom geometry(MultiPolygon, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_geo_municipios_geom ON internal.geo_municipios USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_geo_municipios_uf_municipio ON internal.geo_municipios (uf, municipio_norm);

-- internal.fact_caged_municipio_mes: aggregated CAGED by uf, competencia, municipio
CREATE TABLE IF NOT EXISTS internal.fact_caged_municipio_mes (
    uf TEXT NOT NULL,
    competenciamov TEXT NOT NULL,
    municipio_norm TEXT NOT NULL,
    saldo_sum BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fact_caged_uf_competencia ON internal.fact_caged_municipio_mes (uf, competenciamov);
CREATE INDEX IF NOT EXISTS idx_fact_caged_uf_competencia_municipio ON internal.fact_caged_municipio_mes (uf, competenciamov, municipio_norm);

-- internal.current_competencia: single row for active map view (uf + competenciamov)
CREATE TABLE IF NOT EXISTS internal.current_competencia (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    uf TEXT NOT NULL DEFAULT 'PR',
    competenciamov TEXT NOT NULL
);

INSERT INTO internal.current_competencia (id, uf, competenciamov)
VALUES (1, 'PR', '2024-01')
ON CONFLICT (id) DO NOTHING;
