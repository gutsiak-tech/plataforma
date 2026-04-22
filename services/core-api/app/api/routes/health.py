from fastapi import APIRouter

from app.services.debug_service import debug_counts

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/api/debug/counts")
def debug_counts_route():
    """Temporary debug: table row counts and current_competencia."""
    return debug_counts()
