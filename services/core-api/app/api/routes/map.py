from fastapi import APIRouter
from pydantic import BaseModel

from app.services.map_service import set_competencia

router = APIRouter()


class SetCompetenciaBody(BaseModel):
    uf: str = "PR"
    competenciamov: str  # YYYY-MM


@router.post("/api/map/set_competencia")
def map_set_competencia(body: SetCompetenciaBody):
    return set_competencia(body.uf, body.competenciamov)
