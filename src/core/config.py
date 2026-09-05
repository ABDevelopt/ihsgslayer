import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "IHSG Slayer"
    APP_ENV: str = "development"
    API_PORT: int = 8000
    DATABASE_URL: str = "sqlite+aiosqlite:///./ihsgslayer.db"
    LOG_LEVEL: str = "INFO"
    
    # Telegram Integration
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    
    # Trading Defaults
    DEFAULT_BENCHMARK: str = "^JKSE"
    IDX_BUY_FEE: float = 0.0015   # 0.15% broker buy commission
    IDX_SELL_FEE: float = 0.0025  # 0.25% broker sell commission (incl. 0.1% final sales tax)
    DEFAULT_SLIPPAGE: float = 0.0010 # 0.10% baseline slippage
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
