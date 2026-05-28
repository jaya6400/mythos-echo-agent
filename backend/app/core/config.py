import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Force load the .env parameters into the system runtime environment
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mythos Echo Agent"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ELASTIC_URL: str = os.getenv("ELASTIC_URL", "")
    ELASTIC_API_KEY: str = os.getenv("ELASTIC_API_KEY", "")
    GOOGLE_CLOUD_PROJECT: Optional[str] = os.getenv("GOOGLE_CLOUD_PROJECT")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    @property
    def has_elastic_credentials(self) -> bool:
        """Helper properties to check credentials availability in health checks."""
        return bool(self.ELASTIC_URL and self.ELASTIC_API_KEY)

    @property
    def has_google_credentials(self) -> bool:
        """Helper to verify Google AI tools environment readiness."""
        return bool(self.GOOGLE_CLOUD_PROJECT or self.GEMINI_API_KEY)

# Instantiate settings to be imported by other application modules
settings = Settings()
