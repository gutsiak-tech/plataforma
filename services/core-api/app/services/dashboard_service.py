import logging

from app.repositories.dashboard_repository import (
    get_dashboard_kpis_rows,
    get_dashboard_ranking_rows,
    get_dashboard_summary_row,
    get_dashboard_table_rows,
    get_dashboard_timeseries_rows,
    get_dashboard_top_bottom_rows,
    get_distribution_bins_rows,
    get_distribution_span,
    get_heatmap_salary_sector_age_rows,
    get_kpi_panel_row,
    get_salary_box_by_education_rows,
    get_salary_by_age_gender_rows,
    get_timeseries_saldo_rows,
    get_top_countries_rows,
    get_top_municipios_mov_rows,
    get_treemap_input_stats,
    get_treemap_rows_raw,
)

logger = logging.getLogger("uvicorn.error")


def summary(uf: str, competencia: str) -> dict:
    row = get_dashboard_summary_row(uf, competencia)
    if not row:
        return {
            "uf": uf,
            "competencia": competencia,
            "municipio_count": 0,
            "total_saldo": 0,
            "min_saldo": None,
            "max_saldo": None,
        }
    return {
        "uf": row["uf"],
        "competencia": row["competenciamov"],
        "municipio_count": row["municipio_count"],
        "total_saldo": row["total_saldo"],
        "min_saldo": row["min_saldo"],
        "max_saldo": row["max_saldo"],
    }


def top_bottom(uf: str, competencia: str) -> dict:
    top, bottom = get_dashboard_top_bottom_rows(uf, competencia)
    return {"top": top, "bottom": bottom}


def kpis(uf: str, competencia: str) -> dict:
    agg, best, worst = get_dashboard_kpis_rows(uf, competencia)
    return {
        "uf": uf,
        "competencia": competencia,
        "total_saldo": int(agg["total_saldo"] or 0),
        "municipio_count": int(agg["municipio_count"] or 0),
        "mean_saldo": float(agg["mean_saldo"] or 0),
        "min_saldo": agg["min_saldo"],
        "max_saldo": agg["max_saldo"],
        "best_municipio": dict(best) if best else None,
        "worst_municipio": dict(worst) if worst else None,
    }


def ranking(uf: str, competencia: str, limit: int, order: str) -> dict:
    order_sql = "DESC" if order.lower() != "asc" else "ASC"
    rows = get_dashboard_ranking_rows(uf, competencia, limit, order_sql)
    return {"rows": rows}


def distribution(uf: str, competencia: str, bins: int) -> dict:
    span = get_distribution_span(uf, competencia)
    min_v = span["min_saldo"]
    max_v = span["max_saldo"]
    if min_v is None or max_v is None:
        return {"bins": []}

    if min_v == max_v:
        return {
            "bins": [
                {
                    "bucket": 1,
                    "range_start": int(min_v),
                    "range_end": int(max_v),
                    "municipio_count": 1,
                }
            ]
        }

    rows = get_distribution_bins_rows(uf, competencia, min_v, max_v, bins)
    return {"bins": rows}


def timeseries(uf: str, limit: int) -> dict:
    rows = get_dashboard_timeseries_rows(uf, limit)
    return {"rows": rows}


def kpi_panel(uf: str, competencia: str) -> dict:
    row = get_kpi_panel_row(uf, competencia)

    missing = []
    if int(row["salary_rows"] or 0) == 0:
        missing.append("salario")
    if int(row["countries_count"] or 0) == 0:
        missing.append("pais")

    return {
        "uf": uf,
        "competencia": competencia,
        "total_records": int(row["total_records"] or 0),
        "salary_mean": float(row["salary_mean"]) if row["salary_mean"] is not None else None,
        "salary_median": float(row["salary_median"]) if row["salary_median"] is not None else None,
        "salary_p90": float(row["salary_p90"]) if row["salary_p90"] is not None else None,
        "countries_count": int(row["countries_count"] or 0),
        "missing_fields": missing,
    }


def top_countries(uf: str, competencia: str, top_n: int) -> dict:
    rows = get_top_countries_rows(uf, competencia, top_n)
    return {"rows": rows, "missing_fields": [] if rows else ["pais"]}


def salary_by_age_gender(uf: str, competencia: str) -> dict:
    rows = get_salary_by_age_gender_rows(uf, competencia)
    missing = [] if rows else ["salario", "faixa_etaria", "sexo"]
    return {"rows": rows, "missing_fields": missing}


def salary_box_by_education(uf: str, competencia: str) -> dict:
    rows = get_salary_box_by_education_rows(uf, competencia)
    missing = [] if rows else ["salario", "nivel_instrucao"]
    return {"rows": rows, "missing_fields": missing}


def treemap_sector_country(uf: str, competencia: str) -> list[dict]:
    logger.info("dashboard_treemap_sector_country request uf=%s competencia=%s", uf, competencia)
    input_stats = get_treemap_input_stats(uf, competencia)
    raw_rows = get_treemap_rows_raw(uf, competencia)

    rows = []
    for r in raw_rows:
        row = dict(r)
        salario_medio = row.get("salario_medio")
        if salario_medio is not None:
            try:
                s = float(salario_medio)
                if s != s or s == float("inf") or s == float("-inf"):
                    row["salario_medio"] = None
                else:
                    row["salario_medio"] = s
            except (TypeError, ValueError):
                row["salario_medio"] = None
        row["contagem"] = int(row["contagem"])
        rows.append(row)

    salario_vals = [float(r["salario_medio"]) for r in rows if r.get("salario_medio") is not None]
    salario_min = min(salario_vals) if salario_vals else None
    salario_max = max(salario_vals) if salario_vals else None

    logger.info(
        "dashboard_treemap_sector_country stats uf=%s competencia=%s row_count=%s null_secao_count=%s null_pais_count=%s invalid_salary_count=%s salario_min=%s salario_max=%s",
        uf,
        competencia,
        len(rows),
        int(input_stats["null_or_empty_secao_count"] or 0),
        int(input_stats["null_or_empty_pais_count"] or 0),
        int(input_stats["invalid_salary_count"] or 0),
        salario_min,
        salario_max,
    )

    if not rows:
        logger.info("dashboard_treemap_sector_country empty_result uf=%s competencia=%s", uf, competencia)
        return []
    return rows


def timeseries_saldo(uf: str, from_: str | None, to: str | None) -> dict:
    rows = get_timeseries_saldo_rows(uf, from_, to)
    if not from_ and not to and len(rows) > 12:
        rows = rows[-12:]
    return {"rows": rows, "missing_fields": [] if rows else ["competenciamov", "saldomovimentacao"]}


def heatmap_salary_sector_age(uf: str, competencia: str) -> dict:
    rows = get_heatmap_salary_sector_age_rows(uf, competencia)
    if not rows:
        return {"rows": [], "cols": [], "values": [], "missing_fields": ["secao", "faixa_etaria", "salario"]}

    row_labels = sorted({r["secao"] for r in rows})
    col_labels = sorted({r["faixa_etaria"] for r in rows})
    index_row = {v: i for i, v in enumerate(row_labels)}
    index_col = {v: i for i, v in enumerate(col_labels)}
    matrix = [[None for _ in col_labels] for _ in row_labels]
    for r in rows:
        matrix[index_row[r["secao"]]][index_col[r["faixa_etaria"]]] = float(r["salario_medio"])

    return {"rows": row_labels, "cols": col_labels, "values": matrix, "missing_fields": []}


def top_municipios_mov(uf: str, competencia: str, top_n: int) -> dict:
    rows = get_top_municipios_mov_rows(uf, competencia, top_n)
    return {"rows": rows, "missing_fields": [] if rows else ["municipio", "saldomovimentacao"]}


def dashboard_table(uf: str, competencia: str, limit: int, offset: int, sort: str) -> dict:
    sort_map = {
        "municipio": "municipio",
        "saldo_sum": "saldo_sum",
        "salario_medio": "salario_medio",
        "registros": "registros",
    }
    sort_field, _, sort_dir = sort.partition(":")
    sql_field = sort_map.get(sort_field, "saldo_sum")
    sql_dir = "ASC" if sort_dir.lower() == "asc" else "DESC"

    rows = get_dashboard_table_rows(uf, competencia, limit, offset, sql_field, sql_dir)
    return {"rows": rows, "missing_fields": [] if rows else ["municipio", "saldomovimentacao"]}
