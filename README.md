# Data Platform – Geospatial Labor Market Analytics (Brazil)

**Technical information:** MVP for a Brazil government geospatial analytics site: interactive dashboards and map using **Postgres + PostGIS**, **Tegola** (vector tiles), **FastAPI**, and **React + MapLibre GL JS**.

**Analytics information:** a geospatial analytics platform for the brazilian migrant labor market, based on administrative data (RAIS/CAGED/CTPS), focused on admissions, layoffs, and net job creation at the municipal level. This project implements a functional MVP that integrates a data pipeline, analytical backend, and interactive frontend to explore the spatial and temporal dynamics of formal employment in the state of Paraná (Brazil) for the year 2025.

The application enables:

- analysis of admissions, layoffs and net job balance by municipality and month  
- visualization of regional patterns through vector-based maps  
- exploration of rankings, distributions, and time series in an interactive dashboard  
- synchronization between dashboard filters and the map (e.g., monthly competency)  
- support for territorial diagnostics and data-driven decision-making 

## Why it matters?

Understanding labor market dynamics at a territorial level is essential for:

- designing public policies.
- identifying vulnerable regions.
- monitoring economic activity.
- supporting regional development strategies.

By integrating geospatial data with administrative labor datasets, this project enables:

- spatial diagnostics of employment dynamics based on Spatial Econometrics Techniques.
- statistical evidence-based policy analysis.  
- scalable analytics for government and research use cases.

## Prerequisites

- Docker and Docker Compose
- Internet access (only if no local municipality shapefile is available and fallback `geobr` is needed)
- Existing data:
  - **Bronze (option A, local geometry)**: Municipality shapefiles in `data-lake/bronze/geodata/municipios/uf=PR/ano=2024/` (`.shp`, `.shx`, `.dbf`, `.prj`)
  - **Bronze (option B, fallback)**: if `.shp` is missing, loader automatically downloads municipality boundaries from IBGE via `geobr`
  - **Prata**: Cleaned mapped CSV in `data-lake/prata/` (e.g. `dados_mapeados.csv` with columns: `competenciamov`, `saldomovimentacao`, `uf`, `municipio`, …). Required input data (not fully distributed inside this repository)

## Data availability

This repository does not include the full processed labor dataset (`dados_mapeados.csv`) used in the current MVP.

To run the platform with real data, access to the treated dataset is required. Municipality shapefiles may be loaded from a local source or, if unavailable, retrieved automatically through the existing IBGE/geobr fallback.

For technical evaluation purposes, the treated dataset and shapefiles used in this project can be shared separately by the author.

## Quick start

> Official reproducible path: follow steps 1 -> 5 exactly in this order.

> **Note:** full execution with real data requires access to the treated dataset (`dados_mapeados.csv`), which is not distributed inside this repository.

### 1. Environment

From repo root:

```bash
cp infra/.env.example infra/.env
```

On Windows PowerShell, use:

```powershell
Copy-Item infra/.env.example infra/.env
```

Edit `infra/.env` and set:

- Required: `POSTGRES_PASSWORD`, `PATH_SHAPE_MUNICIPIOS`, `PATH_MAPPED_CSV`, `DEFAULT_UF`
- Usually keep defaults for: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PORT`
- `POSTGRES_HOST` in `infra/.env` is for host-side tools only; in Docker services, compose forces `postgis`.
- `PATH_SHAPE_MUNICIPIOS` must point to a directory visible from inside container (recommended default: `/workspace/data-lake/bronze/geodata/municipios/uf=PR/ano=2024`)
- `PATH_MAPPED_CSV` must point to a file visible from inside container (recommended default: `/workspace/data-lake/prata/dados_mapeados.csv`)

### 2. Start Postgres

```bash
cd infra
docker compose up -d postgis
```

Wait until Postgres is healthy (e.g. `docker compose ps`).

If you have old/stale compose resources from previous attempts, clean first:

```bash
cd infra
docker compose down --remove-orphans
```

### 3. Run migrations and load data

Run the loader once (from repo root so `infra/.env` and paths are correct):

```bash
cd infra
docker compose run --rm -e MIGRATIONS_DIR=/workspace/database/migrations \
  -e PATH_SHAPE_MUNICIPIOS=/workspace/data-lake/bronze/geodata/municipios/uf=PR/ano=2024 \
  -e PATH_MAPPED_CSV=/workspace/data-lake/prata/dados_mapeados.csv \
  core-api python -m app.loader load-all
```

This will:

- Run SQL migrations (schemas, tables, views, materialized view)
- Load municipality geometries from the shapefile into `internal.geo_municipios`
- Load aggregated CAGED data from the CSV into `internal.fact_caged_municipio_mes`
- Set current competência and refresh the materialized view used by Tegola

Unmatched municipality names are logged; the pipeline does not fail.

If there is no `.shp` under `PATH_SHAPE_MUNICIPIOS`, loader logs a warning and uses IBGE (`geobr`) fallback automatically.

### 4. Start all services

```bash
cd infra
docker compose up --build
```

- **API**: http://localhost:8000  
  - Health: http://localhost:8000/health  
  - Meta: http://localhost:8000/api/meta/available_competencias, `/api/meta/available_ufs`  
  - Dashboard: http://localhost:8000/api/dashboard/summary?uf=PR&competencia=YYYY-MM  
  - Map: `POST /api/map/set_competencia` with `{ "uf": "PR", "competenciamov": "YYYY-MM" }`
- **Tiles**: http://localhost:8080/maps/municipios/{z}/{x}/{y}.pbf
- **Frontend**: http://localhost:5173 (Dashboard + Map)

Quick runtime checks:

- `curl http://localhost:8000/health` should return `{"status":"ok"}`
- `curl http://localhost:8000/api/meta/available_competencias` should return a non-empty array after loader
- `curl http://localhost:8080/capabilities` should list the `municipios` map

### 5. Use the app

- Open http://localhost:5173
- **Dashboard**: KPIs and top/bottom tables; choose UF and competência in the filter bar.
- **Map**: Same filters; map fills by `saldo_sum`, tooltip shows municipio + saldo. Changing competência updates the map (via `set_competencia` and refreshed MV).

## Running the frontend locally (optional)

From repo root:

```bash
cd services/web-frontend
npm install
npm run dev
```

Set in `.env` (or in the shell):

- `VITE_API_BASE_URL=http://localhost:8000` (primary)
- `VITE_API_URL=http://localhost:8000` (legacy fallback only)
- `VITE_TILES_URL=http://localhost:8080`

Ensure Postgres, core-api, and Tegola are running (e.g. `docker compose up -d postgis core-api tegola`).

## Loader commands

Run inside the `core-api` container (with env and `/workspace` mount as above):

- `python -m app.loader load-geo` – load shapefile into `internal.geo_municipios`
- `python -m app.loader load-caged` – load aggregated CSV into `internal.fact_caged_municipio_mes`
- `python -m app.loader load-all` – run migrations, then both loaders, then refresh current competência and MV

## Tile debug test (Tegola)

Run from `infra/`:

```bash
docker compose run --rm core-api python -m app.tile_debug
```

The script fetches Tegola capabilities, computes a tile from the `municipios` map center, requests
`/maps/municipios/{z}/{x}/{y}.pbf`, prints status + byte sizes, and exits non-zero if the tile is empty.

## Smoke check (operational)

After step 4 (`docker compose up --build`), run:

```powershell
powershell -ExecutionPolicy Bypass -File infra/smoke-check.ps1
```

It validates:

- API health and metadata endpoints
- One dashboard endpoint using latest competência
- Tegola capabilities and one tile endpoint
- Frontend index response

## Repository layout

- `data-lake/` – bronze (shapefiles), prata (mapped CSV), ouro (optional)
- `database/migrations/` – SQL (schemas, tables, views, materialized view)
- `services/core-api/` – FastAPI app (routes/services/repositories) + loader
- `services/tileserver/` – Tegola config (MVT from `internal.mv_current_caged_layer`)
- `services/web-frontend/` – React + Vite + MapLibre (dashboard + map)
- `infra/` – `docker-compose.yml`, `.env.example`

## Troubleshooting

- **Meta endpoints return `[]` or dashboard/map stay empty**  
  Check `GET http://localhost:8000/api/debug/counts`. If `count_fact` is 0, the CSV was not loaded into Postgres.  
  - Ensure `PATH_MAPPED_CSV` in `infra/.env` points at your file (default in Docker: `/workspace/data-lake/prata/dados_mapeados.csv`, i.e. `data-lake/prata/dados_mapeados.csv` at repo root).  
  - **Geometries for the map:** `load-all` uses a local `.shp` under `PATH_SHAPE_MUNICIPIOS` when present. If there is **no shapefile**, it automatically loads **IBGE municipality boundaries** via `geobr` (`load-geo-ibge`). You can also run only geometries:  
    `docker compose run --rm core-api python -m app.loader load-geo-ibge`  
    (requires network on first run). Facts-only (no map polygons):  
    `docker compose run --rm core-api python -m app.loader load-caged`  
  - `DEFAULT_UF` must match the state encoded in the CSV (e.g. `PR` for Paraná); the loader keeps only rows for that UF.  
  - If `count_geo` and `count_fact` are 0 and you expected data, confirm the API uses the same DB as the loader (`POSTGRES_*` in `infra/.env`).
  - If counts are non-zero but meta still returns `[]`, the meta endpoints read from `internal.fact_caged_municipio_mes`; confirm that table has rows.

- **Frontend blank white screen**  
  - Open the browser console for errors.  
  - Ensure `VITE_API_URL` and `VITE_TILES_URL` are set (e.g. in `services/web-frontend/.env` or in Docker env).  
  - If the API returns empty arrays, the app should now show “Nenhum dado disponível” instead of crashing.

## Roadmap

Planned improvements and future work:

### Data & Analytics
- [ ] Add spatial econometrics metrics (Moran’s I, LISA)
- [ ] Implement spatial gap indicators (municipality vs neighbors)
- [ ] Integrate additional datasets (IBGE, PNADC and government API)
- [ ] Improve data validation and consistency checks

### Backend & API
- [ ] Add automated tests (unit + integration)
- [ ] Improve error handling and logging
- [ ] Optimize query performance for large datasets

### Frontend & UX
- [ ] Improve interactivity of charts (zoom, drill-down)
- [ ] Add advanced filtering options
- [ ] Improve loading states and feedback

### Infrastructure
- [ ] Add CI/CD pipeline
- [ ] Prepare deployment environment (cloud)
- [ ] Improve monitoring and observability

## Acceptance checklist

- [x] `/health` returns OK
- [x] `/api/meta/available_competencias` and `available_ufs` return values
- [x] Dashboard shows totals and top/bottom for chosen competência
- [x] Map shows municipality boundaries colored by `saldo_sum`
- [x] Changing competência updates map colors (set_competencia + refreshed MV)
- [x] Unmatched municipality names logged; system still works
- [x] No ingestion/ETL beyond the loader for MVP