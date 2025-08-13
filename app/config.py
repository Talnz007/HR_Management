# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from decouple import config
import os # <-- Import os

class Settings(BaseSettings):
    database_url: str = config("DATABASE_URL", default="postgresql://postgres.vzudfmkfnzwgwmkgzvgp:RcN~_RRr9rmZ5RZ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres")
    TEST_DATABASE_URL: str = config("TEST_DATABASE_URL", default="postgresql://postgres:Niazai007@localhost:5432/hr_system_test")
    secret_key: str = config("SECRET_KEY", default="xVmhFHIGrB1MAtP0HKTSM7cQx/qht2bE13VaxG/rfI2YB6RiDKvhpiSfJbfS4vJL2yx512Ndexim5aTaDrR6cw==")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    redis_host: str = config("REDIS_HOST", default="localhost")
    redis_port: int = config("REDIS_PORT", default=6379, cast=int)
    redis_username: str = config("REDIS_USERNAME", default="")
    redis_password: str = config("REDIS_PASSWORD", default="")
    decode_response: bool = False

    # --- ADD THESE TWO LINES ---
    MEDIA_ROOT: str = "media"
    PROFILE_PICTURES_DIR: str = os.path.join(MEDIA_ROOT, "profile_pictures")
    # --- END OF ADDITION ---

    model_config = SettingsConfigDict(env_file=".env",
                                      extra="allow",
                                      case_sensitive=False)

settings = Settings()
