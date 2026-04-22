from app.repositories.meta_repository import get_available_competencias, get_available_ufs


def available_competencias() -> list[str]:
    return get_available_competencias()


def available_ufs() -> list[str]:
    return get_available_ufs()
