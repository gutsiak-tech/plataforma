from app.db import get_conn


def get_dashboard_summary_row(uf: str, competencia: str):
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT uf, competenciamov, municipio_count, total_saldo, min_saldo, max_saldo
            FROM public_api.vw_dashboard_summary
            WHERE uf = %s AND competenciamov = %s
            """,
            (uf, competencia),
        )
        return cur.fetchone()


def get_dashboard_top_bottom_rows(uf: str, competencia: str) -> tuple[list[dict], list[dict]]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT municipio_norm AS municipio, saldo_sum
            FROM internal.fact_caged_municipio_mes
            WHERE uf = %s AND competenciamov = %s
            ORDER BY saldo_sum DESC
            LIMIT 10
            """,
            (uf, competencia),
        )
        top = [dict(r) for r in cur.fetchall()]
        cur = conn.execute(
            """
            SELECT municipio_norm AS municipio, saldo_sum
            FROM internal.fact_caged_municipio_mes
            WHERE uf = %s AND competenciamov = %s
            ORDER BY saldo_sum ASC
            LIMIT 10
            """,
            (uf, competencia),
        )
        bottom = [dict(r) for r in cur.fetchall()]
    return top, bottom


def get_dashboard_kpis_rows(uf: str, competencia: str):
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT
                COALESCE(SUM(saldo_sum), 0) AS total_saldo,
                COUNT(*) AS municipio_count,
                COALESCE(AVG(saldo_sum), 0) AS mean_saldo,
                MIN(saldo_sum) AS min_saldo,
                MAX(saldo_sum) AS max_saldo
            FROM internal.fact_caged_municipio_mes
            WHERE uf = %s AND competenciamov = %s
            """,
            (uf, competencia),
        )
        agg = cur.fetchone()

        cur = conn.execute(
            """
            SELECT municipio_norm AS municipio, saldo_sum
            FROM internal.fact_caged_municipio_mes
            WHERE uf = %s AND competenciamov = %s
            ORDER BY saldo_sum DESC
            LIMIT 1
            """,
            (uf, competencia),
        )
        best = cur.fetchone()

        cur = conn.execute(
            """
            SELECT municipio_norm AS municipio, saldo_sum
            FROM internal.fact_caged_municipio_mes
            WHERE uf = %s AND competenciamov = %s
            ORDER BY saldo_sum ASC
            LIMIT 1
            """,
            (uf, competencia),
        )
        worst = cur.fetchone()
    return agg, best, worst


def get_dashboard_ranking_rows(uf: str, competencia: str, limit: int, order_sql: str) -> list[dict]:
    with get_conn() as conn:
        cur = conn.execute(
            f"""
            SELECT municipio_norm AS municipio, saldo_sum
            FROM internal.fact_caged_municipio_mes
            WHERE uf = %s AND competenciamov = %s
            ORDER BY saldo_sum {order_sql}, municipio_norm ASC
            LIMIT %s
            """,
            (uf, competencia, limit),
        )
        return [dict(r) for r in cur.fetchall()]


def get_distribution_span(uf: str, competencia: str):
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT MIN(saldo_sum) AS min_saldo, MAX(saldo_sum) AS max_saldo
            FROM internal.fact_caged_municipio_mes
            WHERE uf = %s AND competenciamov = %s
            """,
            (uf, competencia),
        )
        return cur.fetchone()


def get_distribution_bins_rows(uf: str, competencia: str, min_v, max_v, bins: int) -> list[dict]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            WITH filtered AS (
                SELECT saldo_sum
                FROM internal.fact_caged_municipio_mes
                WHERE uf = %s AND competenciamov = %s
            ),
            bucketed AS (
                SELECT
                    saldo_sum,
                    width_bucket(saldo_sum::numeric, %s::numeric, (%s::numeric + 0.0001), %s) AS bucket
                FROM filtered
            )
            SELECT
                bucket,
                MIN(saldo_sum) AS range_start,
                MAX(saldo_sum) AS range_end,
                COUNT(*) AS municipio_count
            FROM bucketed
            GROUP BY bucket
            ORDER BY bucket
            """,
            (uf, competencia, min_v, max_v, bins),
        )
        return [dict(r) for r in cur.fetchall()]


def get_dashboard_timeseries_rows(uf: str, limit: int) -> list[dict]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            WITH ranked AS (
                SELECT
                    competenciamov,
                    SUM(saldo_sum) AS total_saldo,
                    AVG(saldo_sum) AS mean_saldo,
                    MIN(saldo_sum) AS min_saldo,
                    MAX(saldo_sum) AS max_saldo,
                    COUNT(*) AS municipio_count
                FROM internal.fact_caged_municipio_mes
                WHERE uf = %s
                GROUP BY competenciamov
                ORDER BY competenciamov DESC
                LIMIT %s
            )
            SELECT *
            FROM ranked
            ORDER BY competenciamov ASC
            """,
            (uf, limit),
        )
        return [dict(r) for r in cur.fetchall()]


def get_kpi_panel_row(uf: str, competencia: str):
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT
                COUNT(*) AS total_records,
                AVG(salario) FILTER (WHERE salario IS NOT NULL) AS salary_mean,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salario)
                    FILTER (WHERE salario IS NOT NULL) AS salary_median,
                PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY salario)
                    FILTER (WHERE salario IS NOT NULL) AS salary_p90,
                COUNT(DISTINCT pais) FILTER (WHERE pais IS NOT NULL AND pais <> '') AS countries_count,
                COUNT(*) FILTER (WHERE salario IS NOT NULL) AS salary_rows
            FROM internal.fact_caged_dashboard_rows
            WHERE uf = %s AND competenciamov = %s
            """,
            (uf, competencia),
        )
        return cur.fetchone()


def get_top_countries_rows(uf: str, competencia: str, top_n: int) -> list[dict]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT pais, COUNT(*) AS total
            FROM internal.fact_caged_dashboard_rows
            WHERE uf = %s AND competenciamov = %s
              AND pais IS NOT NULL AND pais <> ''
            GROUP BY pais
            ORDER BY total DESC, pais ASC
            LIMIT %s
            """,
            (uf, competencia, top_n),
        )
        return [dict(r) for r in cur.fetchall()]


def get_salary_by_age_gender_rows(uf: str, competencia: str) -> list[dict]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT faixa_etaria, sexo, AVG(salario) AS salario_medio, COUNT(*) AS total
            FROM internal.fact_caged_dashboard_rows
            WHERE uf = %s AND competenciamov = %s
              AND salario IS NOT NULL
              AND faixa_etaria IS NOT NULL AND faixa_etaria <> ''
              AND sexo IS NOT NULL AND sexo <> ''
            GROUP BY faixa_etaria, sexo
            ORDER BY faixa_etaria, sexo
            """,
            (uf, competencia),
        )
        return [dict(r) for r in cur.fetchall()]


def get_salary_box_by_education_rows(uf: str, competencia: str) -> list[dict]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT
                nivel_instrucao,
                MIN(salario) AS min_salary,
                PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salario) AS q1_salary,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salario) AS median_salary,
                PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salario) AS q3_salary,
                MAX(salario) AS max_salary,
                COUNT(*) AS total
            FROM internal.fact_caged_dashboard_rows
            WHERE uf = %s AND competenciamov = %s
              AND salario IS NOT NULL
              AND nivel_instrucao IS NOT NULL AND nivel_instrucao <> ''
            GROUP BY nivel_instrucao
            ORDER BY total DESC, nivel_instrucao ASC
            """,
            (uf, competencia),
        )
        return [dict(r) for r in cur.fetchall()]


def get_treemap_input_stats(uf: str, competencia: str):
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT
                COUNT(*) FILTER (WHERE secao IS NULL OR btrim(secao) = '') AS null_or_empty_secao_count,
                COUNT(*) FILTER (WHERE pais IS NULL OR btrim(pais) = '') AS null_or_empty_pais_count,
                COUNT(*) FILTER (
                    WHERE salario IS NULL OR salario::text IN ('NaN', 'Infinity', '-Infinity')
                ) AS invalid_salary_count
            FROM internal.fact_caged_dashboard_rows
            WHERE uf = %s AND competenciamov = %s
            """,
            (uf, competencia),
        )
        return cur.fetchone()


def get_treemap_rows_raw(uf: str, competencia: str):
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT
                secao,
                pais,
                COUNT(*) AS contagem,
                AVG(salario) FILTER (WHERE salario IS NOT NULL) AS salario_medio
            FROM internal.fact_caged_dashboard_rows
            WHERE uf = %s AND competenciamov = %s
              AND secao IS NOT NULL AND btrim(secao) <> ''
              AND pais IS NOT NULL AND btrim(pais) <> ''
            GROUP BY secao, pais
            HAVING COUNT(*) > 0
            ORDER BY contagem DESC, secao ASC, pais ASC
            """,
            (uf, competencia),
        )
        return cur.fetchall()


def get_timeseries_saldo_rows(uf: str, from_: str | None, to: str | None) -> list[dict]:
    where = "WHERE uf = %s"
    params = [uf]
    if from_:
        where += " AND competenciamov >= %s"
        params.append(from_)
    if to:
        where += " AND competenciamov <= %s"
        params.append(to)

    with get_conn() as conn:
        cur = conn.execute(
            f"""
            SELECT competenciamov, SUM(saldomovimentacao) AS saldo_sum
            FROM internal.fact_caged_dashboard_rows
            {where}
            GROUP BY competenciamov
            ORDER BY competenciamov ASC
            """,
            tuple(params),
        )
        return [dict(r) for r in cur.fetchall()]


def get_heatmap_salary_sector_age_rows(uf: str, competencia: str) -> list[dict]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT secao, faixa_etaria, AVG(salario) AS salario_medio
            FROM internal.fact_caged_dashboard_rows
            WHERE uf = %s AND competenciamov = %s
              AND salario IS NOT NULL
              AND secao IS NOT NULL AND secao <> ''
              AND faixa_etaria IS NOT NULL AND faixa_etaria <> ''
            GROUP BY secao, faixa_etaria
            ORDER BY secao, faixa_etaria
            """,
            (uf, competencia),
        )
        return [dict(r) for r in cur.fetchall()]


def get_top_municipios_mov_rows(uf: str, competencia: str, top_n: int) -> list[dict]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT municipio_raw AS municipio, SUM(saldomovimentacao) AS saldo_sum
            FROM internal.fact_caged_dashboard_rows
            WHERE uf = %s AND competenciamov = %s
              AND municipio_raw IS NOT NULL AND municipio_raw <> ''
            GROUP BY municipio_raw
            ORDER BY saldo_sum DESC, municipio_raw ASC
            LIMIT %s
            """,
            (uf, competencia, top_n),
        )
        return [dict(r) for r in cur.fetchall()]


def get_dashboard_table_rows(uf: str, competencia: str, limit: int, offset: int, sql_field: str, sql_dir: str) -> list[dict]:
    with get_conn() as conn:
        cur = conn.execute(
            f"""
            WITH agg AS (
                SELECT
                    municipio_raw AS municipio,
                    SUM(saldomovimentacao) AS saldo_sum,
                    AVG(salario) FILTER (WHERE salario IS NOT NULL) AS salario_medio,
                    COUNT(*) AS registros
                FROM internal.fact_caged_dashboard_rows
                WHERE uf = %s AND competenciamov = %s
                  AND municipio_raw IS NOT NULL AND municipio_raw <> ''
                GROUP BY municipio_raw
            )
            SELECT municipio, saldo_sum, salario_medio, registros
            FROM agg
            ORDER BY {sql_field} {sql_dir}, municipio ASC
            LIMIT %s OFFSET %s
            """,
            (uf, competencia, limit, offset),
        )
        return [dict(r) for r in cur.fetchall()]
