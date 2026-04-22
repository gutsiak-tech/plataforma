from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.map import router as map_router
from app.api.routes.meta import router as meta_router

__all__ = ["dashboard_router", "health_router", "map_router", "meta_router"]
