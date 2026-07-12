import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SSO_BASE_URL: str = "http://10.95.4.84:8080"
    SSO_AUTH_TOKEN: str = ""
    SSO_LOGIN_ID: str = ""
    SSO_ENV: str = ""
    TMS_TENANT_BASE_URL: str = "https://dewdrops-ausyut.zycus.com"
    
    TMS_MODE: str = "live"  # "live" by default using actual connection
    
    DATABASE_URL: str = "sqlite:///./tms_hub.db"
    JWT_SECRET_KEY: str = "tms_user_hub_secret_key_super_secure_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
