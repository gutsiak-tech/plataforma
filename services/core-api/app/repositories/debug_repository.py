from app.db import get_conn


def get_debug_counts() -> dict:
    with get_conn() as conn:
        cur = conn.execute("SELECT COUNT(*) AS n FROM internal.geo_municipios")
        count_geo = cur.fetchone()["n"]
        cur = conn.execute("SELECT COUNT(*) AS n FROM internal.fact_caged_municipio_mes")
        count_fact = cur.fetchone()["n"]
        cur = conn.execute("SELECT uf, competenciamov FROM internal.current_competencia WHERE id = 1")
        row = cur.fetchone()

    current_competencia = {"uf": row["uf"], "competenciamov": row["competenciamov"]} if row else None
    return {
        "count_geo": count_geo,
        "count_fact": count_fact,
        "current_competencia": current_competencia,
    }
