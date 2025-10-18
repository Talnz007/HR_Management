# /home/talnz/PythonProjects/hr-system/app/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from decouple import config
import os

class Settings(BaseSettings):
    database_url: str = config("DATABASE_URL", default="loca_db_link")
    TEST_DATABASE_URL: str = config("TEST_DATABASE_URL", default="loca_db_link")
    secret_key: str = config("SECRET_KEY", default="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    redis_host: str = config("REDIS_HOST", default="localhost")
    redis_port: int = config("REDIS_PORT", default=6379, cast=int)
    redis_username: str = config("REDIS_USERNAME", default="")
    redis_password: str = config("REDIS_PASSWORD", default="")
    decode_response: bool = False

    MEDIA_ROOT: str = "media"
    PROFILE_PICTURES_DIR: str = os.path.join(MEDIA_ROOT, "profile_pictures")

    # --- NEW: Gmail and Supabase Admin Configuration ---
    GMAIL_SENDER_EMAIL: str = config("GMAIL_SENDER_EMAIL", default="mail")
    # Path to your Google Cloud service account JSON file with Gmail API permissions
    GMAIL_API_CREDENTIALS_JSON_PATH: str = config("GMAIL_API_CREDENTIALS_JSON_PATH", default="json")
    SUPABASE_URL: str = config("SUPABASE_URL", default="link")
    SUPABASE_SERVICE_ROLE_KEY: str = config("SUPABASE_SERVICE_ROLE_KEY", default="key")
    # --- END OF NEW CONFIGURATION ---

    model_config = SettingsConfigDict(env_file=".env",
                                      extra="allow",
                                      case_sensitive=False)

settings = Settings()
