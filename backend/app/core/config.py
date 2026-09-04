import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "ReconOS — AI Finance Control Plane"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./reconos.db",
        description="Async database connection string. Supports SQLite and PostgreSQL."
    )
    
    # Financial Configuration
    DEFAULT_CURRENCY: str = "INR"
    AMOUNT_TOLERANCE_PAISE: int = 200        # ₹2.00 tolerance for rounding/slight variances
    SETTLEMENT_WINDOW_DAYS: int = 2          # Standard T+2 settlement window
    HIGH_RISK_THRESHOLD_PAISE: int = 5000000  # ₹50,000 threshold for mandatory human review
    CRITICAL_RISK_THRESHOLD_PAISE: int = 20000000 # ₹200,000 threshold for critical risk
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # AI / LLM Configuration
    GEMINI_API_KEY: str = Field(default="", description="Optional Gemini API key for live inference")
    OPENAI_API_KEY: str = Field(default="", description="Optional OpenAI API key")
    MOCK_AI_FALLBACK: bool = True  # Deterministic high-quality offline financial reasoning
    
    # JWT / Auth
    SECRET_KEY: str = "reconos-finance-control-plane-secret-key-buildathon-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
