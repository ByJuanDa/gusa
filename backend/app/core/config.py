from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "GUSA API"
    SECRET_KEY: str = "cambia-esta-clave-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str = "sqlite:///./gusa.db"
    # Orígenes permitidos separados por coma, ej: https://mifrontend.up.railway.app
    # En desarrollo puede dejarse * pero en producción DEBE especificarse el dominio real
    ALLOWED_ORIGINS: str = "*"

    class Config:
        env_file = ".env"


settings = Settings()
