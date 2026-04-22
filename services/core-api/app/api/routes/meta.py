from fastapi import APIRouter

from app.services.meta_service import available_competencias, available_ufs

router = APIRouter()


@router.get("/api/meta/available_competencias")
def available_competencias_route():
    return available_competencias()


@router.get("/api/meta/available_ufs")
def available_ufs_route():
    return available_ufs()
