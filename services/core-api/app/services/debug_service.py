from app.repositories.debug_repository import get_debug_counts


def debug_counts() -> dict:
    return get_debug_counts()
