from app.db import set_current_competencia


def set_map_competencia(uf: str, competenciamov: str) -> None:
    set_current_competencia(uf, competenciamov)
