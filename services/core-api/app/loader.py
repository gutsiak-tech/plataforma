"""
Loader commands:
  python -m app.loader load-geo       # shapefile -> internal.geo_municipios
  python -m app.loader load-geo-ibge  # IBGE (geobr) -> geo when there is no .shp
  python -m app.loader load-caged       # CSV -> internal.fact_caged_municipio_mes
  python -m app.loader load-all        # geo (shapefile or IBGE fallback) + load-caged
"""
import argparse
import logging
import sys
import unicodedata
import re
from pathlib import Path

# Add project root so app is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.db import get_conn, run_migrations
from app.normalize import normalize_municipio

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# Required columns for CAGED CSV ingestion. Map canonical names -> accepted aliases.
REQUIRED_CAGED_COLUMNS = [
    "competenciamov",
    "saldomovimentacao",
    "uf",
    "municipio",
    "pais",
    "continente",
    "secao",
    "categoria",
    "sexo",
    "nivel_instrucao",
    "faixa_etaria",
    "racacor",
    "salario",
]
# Optional aliases (e.g. if CSV uses different naming). First match wins.
COLUMN_ALIASES = {
    "competenciamov": ["competenciamov", "competencia", "competência"],
    "saldomovimentacao": ["saldomovimentacao", "saldo_movimentacao", "saldo"],
    "uf": ["uf", "sigla_uf", "estado"],
    "municipio": ["municipio", "município", "municipio_nome"],
    "pais": ["pais", "país", "pais_origem"],
    "continente": ["continente"],
    "secao": ["secao", "seção", "secao_cnae"],
    "categoria": ["categoria"],
    "sexo": ["sexo"],
    "nivel_instrucao": ["nivel_instrucao", "nivel_instrução", "escolaridade"],
    "faixa_etaria": ["faixa_etaria", "faixa etaria", "faixa_etária"],
    "racacor": ["racacor", "raça_cor", "raca_cor"],
    "salario": ["salario", "salário", "salario_fixo", "valorsalariofixo"],
}

UF_CODES = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT",
    "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO",
    "RR", "SC", "SP", "SE", "TO",
}

BRAZIL_STATE_TO_UF = {
    "ACRE": "AC",
    "ALAGOAS": "AL",
    "AMAPA": "AP",
    "AMAZONAS": "AM",
    "BAHIA": "BA",
    "CEARA": "CE",
    "DISTRITO FEDERAL": "DF",
    "ESPIRITO SANTO": "ES",
    "GOIAS": "GO",
    "MARANHAO": "MA",
    "MATO GROSSO": "MT",
    "MATO GROSSO DO SUL": "MS",
    "MINAS GERAIS": "MG",
    "PARA": "PA",
    "PARAIBA": "PB",
    "PARANA": "PR",
    "PERNAMBUCO": "PE",
    "PIAUI": "PI",
    "RIO DE JANEIRO": "RJ",
    "RIO GRANDE DO NORTE": "RN",
    "RIO GRANDE DO SUL": "RS",
    "RONDONIA": "RO",
    "RORAIMA": "RR",
    "SANTA CATARINA": "SC",
    "SAO PAULO": "SP",
    "SERGIPE": "SE",
    "TOCANTINS": "TO",
}


def _resolve_csv_columns(raw_columns: list[str]) -> dict[str, str]:
    """
    Resolve CSV column names to canonical names using aliases.
    Returns dict: canonical_name -> actual_csv_column_name.
    Raises ValueError with clear message if any required column is missing.
    """
    raw_set = {str(c).strip() for c in raw_columns}
    resolved = {}
    missing = []

    for canonical in REQUIRED_CAGED_COLUMNS:
        aliases = COLUMN_ALIASES.get(canonical, [canonical])
        found = None
        for alias in aliases:
            # Case-insensitive match
            for r in raw_set:
                if r.upper() == alias.upper():
                    found = r
                    break
            if found:
                break
        if found:
            resolved[canonical] = found
        else:
            missing.append(canonical)

    if missing:
        raise ValueError(
            f"CSV missing required columns: {missing}. "
            f"Available columns: {sorted(raw_set)}. "
            f"Consider adding aliases in loader.py COLUMN_ALIASES if the CSV uses different names."
        )
    return resolved


def _normalize_text(value: str) -> str:
    if value is None:
        return ""
    s = str(value).strip().upper()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = " ".join(s.split())
    return s


def normalize_uf(value: str) -> str:
    """
    Normalize UF values from either 2-letter codes or full Brazilian state names.
    Returns original normalized input when no mapping is found.
    """
    s = _normalize_text(value)
    if len(s) == 2 and s.isalpha():
        return s
    return BRAZIL_STATE_TO_UF.get(s, s)


def parse_salary(value) -> float | None:
    """
    Parse salary values robustly (handles BR comma decimal and noisy strings).
    Returns None when parsing fails.
    """
    if value is None:
        return None
    s = str(value).strip()
    if s == "" or s.lower() in {"nan", "none", "null"}:
        return None
    # Keep digits, commas, dots and minus.
    s = re.sub(r"[^0-9,.\-]", "", s)
    if s == "":
        return None
    # If both separators exist, assume dot is thousands and comma is decimal (pt-BR).
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    # If only comma exists, treat comma as decimal separator.
    elif "," in s:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _migrations_dir() -> Path:
    if settings.migrations_dir:
        return Path(settings.migrations_dir)
    # plataforma/database/migrations from repo root (services/core-api/app -> plataforma)
    return Path(__file__).resolve().parent.parent.parent.parent / "database" / "migrations"


def load_geo() -> None:
    path = Path(settings.path_shape_municipios)
    if not path.exists():
        raise FileNotFoundError(f"PATH_SHAPE_MUNICIPIOS does not exist: {path}")

    import geopandas as gpd

    # Find first .shp in directory or in subdirs (e.g. uf=PR/ano=2024)
    shp_files = list(path.rglob("*.shp"))
    if not shp_files:
        raise FileNotFoundError(f"No .shp file under {path}")

    gdf = gpd.read_file(shp_files[0])
    if gdf.crs is None or str(gdf.crs) != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")

    # Detect geometry and name column
    geom_col = gdf.geometry.name
    name_candidates = ["NM_MUN", "NM_MUNICIP", "NOME", "nome", "NM_MUNI", "municipio"]
    name_col = None
    for c in name_candidates:
        if c in gdf.columns:
            name_col = c
            break
    if name_col is None:
        name_col = [c for c in gdf.columns if c != geom_col and "geom" not in c.lower()][0]

    uf = normalize_uf(settings.default_uf)
    if "UF" in gdf.columns:
        uf = normalize_uf(str(gdf["UF"].iloc[0])) if len(gdf) else normalize_uf(settings.default_uf)
    elif "SIGLA" in gdf.columns:
        uf = normalize_uf(str(gdf["SIGLA"].iloc[0])) if len(gdf) else normalize_uf(settings.default_uf)

    with get_conn() as conn:
        conn.execute("TRUNCATE internal.geo_municipios")
        for _, row in gdf.iterrows():
            raw = str(row[name_col]) if name_col else ""
            norm = normalize_municipio(raw)
            geom = row[geom_col]
            if geom is None or geom.is_empty:
                continue
            wkt = geom.wkt
            conn.execute(
                """
                INSERT INTO internal.geo_municipios (uf, municipio_norm, municipio_raw, geom)
                VALUES (%s, %s, %s, ST_GeomFromText(%s, 4326))
                """,
                (uf, norm, raw or None, wkt),
            )
    logger.info("Loaded %s rows into internal.geo_municipios", len(gdf))
    with get_conn() as conn:
        conn.execute("REFRESH MATERIALIZED VIEW internal.mv_current_caged_layer")
    logger.info("Refreshed internal.mv_current_caged_layer after shapefile geo load")


def load_geo_from_ibge(year: int = 2020) -> None:
    """
    Load municipality boundaries from IBGE via geobr when no local shapefile is available.
    Filters by DEFAULT_UF (e.g. PR). Refreshes mv_current_caged_layer so Tegola serves tiles.
    """
    import geobr
    import pandas as pd

    default_uf = normalize_uf(settings.default_uf)
    gdf = geobr.read_municipality(code_muni="all", year=year, simplified=True, verbose=False)
    gdf = gdf[gdf["abbrev_state"] == default_uf].copy()
    if gdf.empty:
        raise RuntimeError(f"geobr returned no municipalities for UF={default_uf} (year={year})")
    if gdf.crs is None or str(gdf.crs) != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")

    geom_col = gdf.geometry.name
    with get_conn() as conn:
        conn.execute("TRUNCATE internal.geo_municipios")
        for _, row in gdf.iterrows():
            raw = str(row["name_muni"]) if pd.notna(row.get("name_muni")) else ""
            norm = normalize_municipio(raw)
            geom = row[geom_col]
            if geom is None or geom.is_empty:
                continue
            wkt = geom.wkt
            conn.execute(
                """
                INSERT INTO internal.geo_municipios (uf, municipio_norm, municipio_raw, geom)
                VALUES (%s, %s, %s, ST_GeomFromText(%s, 4326))
                """,
                (default_uf, norm, raw or None, wkt),
            )
    logger.info("Loaded %s rows into internal.geo_municipios from IBGE (geobr, year=%s)", len(gdf), year)
    with get_conn() as conn:
        conn.execute("REFRESH MATERIALIZED VIEW internal.mv_current_caged_layer")
    logger.info("Refreshed internal.mv_current_caged_layer after IBGE geo load")


def load_caged() -> None:
    path = Path(settings.path_mapped_csv)
    if not path.exists():
        raise FileNotFoundError(f"PATH_MAPPED_CSV does not exist: {path}")

    import pandas as pd

    default_uf = normalize_uf(settings.default_uf)
    # Read header first to validate/resolve columns
    df_header = pd.read_csv(path, nrows=0)
    col_map = _resolve_csv_columns(list(df_header.columns))

    # Read full CSV; use only required columns (extra columns are ok and ignored for processing)
    usecols = list(col_map.values())
    df = pd.read_csv(
        path,
        usecols=usecols,
        dtype={csv_col: str for csv_col in usecols},
        low_memory=False,
    )
    # Rename to canonical names for downstream processing
    df = df.rename(columns={v: k for k, v in col_map.items()})
    uf_before = sorted(df["uf"].dropna().astype(str).map(_normalize_text).unique().tolist())
    logger.info("UF values before normalization (sample=%s, total=%s)", uf_before[:20], len(uf_before))

    df["uf"] = df["uf"].apply(normalize_uf)

    uf_after = sorted(df["uf"].dropna().astype(str).map(_normalize_text).unique().tolist())
    logger.info("UF values after normalization (sample=%s, total=%s)", uf_after[:20], len(uf_after))

    unmapped = sorted({u for u in uf_after if u and u not in UF_CODES})
    if unmapped:
        logger.warning("UF values could not be mapped to known Brazilian UF codes: %s", unmapped[:50])
        if len(unmapped) > 50:
            logger.warning("... and %s more unmapped UFs", len(unmapped) - 50)

    df = df[df["uf"] == default_uf].copy()
    logger.info("Rows after UF filter (%s): %s", default_uf, len(df))
    df["municipio_raw"] = df["municipio"].fillna("").astype(str)
    df["municipio_norm"] = df["municipio"].map(lambda x: normalize_municipio(str(x)) if pd.notna(x) else "")
    df["competenciamov"] = df["competenciamov"].astype(str).str.strip()
    # YYYYMM -> YYYY-MM
    df["competenciamov"] = df["competenciamov"].str.replace(r"^(\d{4})(\d{2})$", r"\1-\2", regex=True)
    df["saldomovimentacao"] = pd.to_numeric(df["saldomovimentacao"], errors="coerce").fillna(0).astype("int64")
    df["salario_parsed"] = df["salario"].map(parse_salary)

    agg = df.groupby(["uf", "competenciamov", "municipio_norm"], as_index=False)["saldomovimentacao"].sum()
    agg.columns = ["uf", "competenciamov", "municipio_norm", "saldo_sum"]

    with get_conn() as conn:
        conn.execute("TRUNCATE internal.fact_caged_municipio_mes")
        conn.execute("TRUNCATE internal.fact_caged_dashboard_rows")
        for _, row in agg.iterrows():
            conn.execute(
                """
                INSERT INTO internal.fact_caged_municipio_mes (uf, competenciamov, municipio_norm, saldo_sum)
                VALUES (%s, %s, %s, %s)
                """,
                (row["uf"], row["competenciamov"], row["municipio_norm"], int(row["saldo_sum"])),
            )

        for _, row in df.iterrows():
            conn.execute(
                """
                INSERT INTO internal.fact_caged_dashboard_rows (
                    uf, competenciamov, municipio_norm, municipio_raw,
                    pais, continente, secao, categoria, sexo, nivel_instrucao,
                    faixa_etaria, racacor, salario, saldomovimentacao
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    row.get("uf"),
                    row.get("competenciamov"),
                    row.get("municipio_norm"),
                    row.get("municipio_raw"),
                    row.get("pais"),
                    row.get("continente"),
                    row.get("secao"),
                    row.get("categoria"),
                    row.get("sexo"),
                    row.get("nivel_instrucao"),
                    row.get("faixa_etaria"),
                    row.get("racacor"),
                    row.get("salario_parsed"),
                    int(row.get("saldomovimentacao", 0)),
                ),
            )

    logger.info("Loaded %s aggregated rows into internal.fact_caged_municipio_mes", len(agg))
    logger.info("Loaded %s rows into internal.fact_caged_dashboard_rows", len(df))

    # Update current_competencia and refresh materialized view so map + Tegola reflect new data
    with get_conn() as conn:
        cur = conn.execute(
            "SELECT competenciamov FROM internal.fact_caged_municipio_mes WHERE uf = %s ORDER BY competenciamov DESC LIMIT 1",
            (default_uf,),
        )
        row = cur.fetchone()
        comp = row["competenciamov"] if row else "2024-01"
        conn.execute(
            "UPDATE internal.current_competencia SET uf = %s, competenciamov = %s WHERE id = 1",
            (default_uf, comp),
        )
        conn.execute("REFRESH MATERIALIZED VIEW internal.mv_current_caged_layer")
    logger.info("Updated current_competencia to %s/%s and refreshed mv_current_caged_layer", default_uf, comp)

    if len(agg) == 0:
        logger.warning(
            "No fact rows inserted. Check DEFAULT_UF=%s and UF normalization/source values.",
            default_uf,
        )

    # Log unmatched: municipio_norm in fact but not in geo (we'd need geo loaded first)
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT DISTINCT f.municipio_norm
            FROM internal.fact_caged_municipio_mes f
            LEFT JOIN internal.geo_municipios g ON g.uf = f.uf AND g.municipio_norm = f.municipio_norm
            WHERE g.municipio_norm IS NULL
            """
        )
        unmatched = [r["municipio_norm"] for r in cur.fetchall()]
    if unmatched:
        logger.warning("Unmatched municipality names (no geometry): %s", unmatched[:50])
        if len(unmatched) > 50:
            logger.warning("... and %s more", len(unmatched) - 50)


def load_all() -> None:
    run_migrations(_migrations_dir())
    path = Path(settings.path_shape_municipios)
    shp_files = list(path.rglob("*.shp")) if path.exists() else []
    if shp_files:
        load_geo()
    else:
        logger.warning(
            "No .shp under PATH_SHAPE_MUNICIPIOS=%s; loading boundaries from IBGE (geobr).",
            path,
        )
        load_geo_from_ibge()
    load_caged()  # already updates current_competencia and refreshes mv_current_caged_layer
    logger.info("load-all finished.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Data loader for geospatial analytics MVP")
    parser.add_argument(
        "command",
        choices=["load-geo", "load-geo-ibge", "load-caged", "load-all"],
        help="Loader command",
    )
    args = parser.parse_args()

    if args.command == "load-geo":
        run_migrations(_migrations_dir())
        load_geo()
    elif args.command == "load-geo-ibge":
        run_migrations(_migrations_dir())
        load_geo_from_ibge()
    elif args.command == "load-caged":
        run_migrations(_migrations_dir())
        load_caged()
    elif args.command == "load-all":
        load_all()


if __name__ == "__main__":
    main()
