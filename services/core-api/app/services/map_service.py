from app.repositories.map_repository import set_map_competencia


def set_competencia(uf: str, competenciamov: str) -> dict:
    set_map_competencia(uf, competenciamov)
    return {"uf": uf, "competenciamov": competenciamov}
