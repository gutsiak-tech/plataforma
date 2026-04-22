from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "plataforma"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"

    path_shape_municipios: str = ""
    path_mapped_csv: str = ""
    default_uf: str = "PR"
    migrations_dir: str = ""  # If set (e.g. in Docker), use instead of repo-relative path

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_safe_log(self) -> str:
        """Connection string with password redacted for startup logging."""
        return (
            f"postgresql://{self.postgres_user}:****"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
