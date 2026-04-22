from app.db import get_conn


def get_available_competencias() -> list[str]:
    with get_conn() as conn:
        cur = conn.execute(
            "SELECT DISTINCT competenciamov FROM internal.fact_caged_municipio_mes ORDER BY competenciamov"
        )
        rows = cur.fetchall()
    return [r["competenciamov"] for r in rows]


def get_available_ufs() -> list[str]:
    with get_conn() as conn:
        cur = conn.execute("SELECT DISTINCT uf FROM internal.fact_caged_municipio_mes ORDER BY uf")
        rows = cur.fetchall()
    return [r["uf"] for r in rows]
