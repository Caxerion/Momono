from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DB_PATH = BASE_DIR / "momono.db"

DEFAULT_CONFIG = {
    "provider": "openrouter",
    "model": "anthropic/claude-3.5-sonnet",
    "api_base": "https://openrouter.ai/api/v1",
    "api_key": "",
    "temperature": 0.9,
    "max_tokens": 1024,
    "host": "127.0.0.1",
    "port": 8000,
}
