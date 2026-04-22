import os
from contextlib import contextmanager
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

from app.config import settings


def get_connection_string() -> str:
    return settings.database_url


@contextmanager
def get_conn():
    conn = psycopg.connect(get_connection_string(), row_factory=dict_row)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def run_migrations(migrations_dir: Path) -> None:
    """Run SQL migration files in order."""
    if not migrations_dir.exists():
        return
    files = sorted(p for p in migrations_dir.glob("*.sql"))
    with get_conn() as conn:
        for f in files:
            sql = f.read_text(encoding="utf-8")
            conn.execute(sql)


def set_current_competencia(uf: str, competenciamov: str) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            UPDATE internal.current_competencia
            SET uf = %s, competenciamov = %s
            WHERE id = 1
            """,
            (uf, competenciamov),
        )
        conn.execute("REFRESH MATERIALIZED VIEW internal.mv_current_caged_layer")
