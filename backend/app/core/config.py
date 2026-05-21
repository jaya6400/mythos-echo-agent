import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Configure Pydantic to read from a local .env file in the workspace
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General API Configuration
    PROJECT_NAME: str = "Mythos Echo Agent API"
    API_V1_STR: str = "/api/v1"
    
    # Elasticsearch configurations (Elastic MCP Gateway connection)
    ELASTIC_URL: str = "http://localhost:9200"
    ELASTIC_API_KEY: Optional[str] = None
    
    # Google Cloud & Gemini configurations (Section 7B compliant)
    GOOGLE_CLOUD_PROJECT: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

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
