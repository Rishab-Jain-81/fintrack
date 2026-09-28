from functools import lru_cache

from pydantic import SecretStr, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    project_name: str
    environment: str = "development"
    debug: bool = False
    api_v1_str: str

    database_name: str
    postgre_host: str
    postgre_port: int
    postgre_user: str
    postgre_password: SecretStr

    @computed_field
    @property
    def async_db_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgre_user}:{self.postgre_password.get_secret_value()}@{self.postgre_host}:{self.postgre_port}/{self.database_name}"

    @computed_field
    @property
    def sync_db_url(self) -> str:
        return f"postgresql+psycopg2://{self.postgre_user}:{self.postgre_password.get_secret_value()}@{self.postgre_host}:{self.postgre_port}/{self.database_name}"

    jwt_secret_key: SecretStr
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    redis_url: str

    allowed_origins: list[str]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
