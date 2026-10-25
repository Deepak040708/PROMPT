import os
from pathlib import Path
from dotenv import load_dotenv

# Locate and load .env from backend directory or project root
BASE_DIR = Path(__file__).resolve().parent.parent
env_backend = BASE_DIR / ".env"
env_root = BASE_DIR.parent / ".env"

if env_backend.exists():
    load_dotenv(dotenv_path=env_backend, override=True)
elif env_root.exists():
    load_dotenv(dotenv_path=env_root, override=True)
else:
    load_dotenv(override=True)

class Settings:
    def __init__(self):
        self.ai_api_key: str = (os.getenv("AI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")).strip()
        self.ai_model: str = os.getenv("AI_MODEL", "gemini-3.8-flash").strip()
        self.ai_base_url: str = os.getenv("AI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta").strip()
        default_db = "/tmp/prompts.db" if os.getenv("VERCEL") else str(BASE_DIR / "prompts.db")
        self.database_path: str = os.getenv("DATABASE_PATH", default_db).strip()
        self.port: int = int(os.getenv("PORT", "8000"))
        self.host: str = os.getenv("HOST", "127.0.0.1")

    def reload(self):
        if env_backend.exists():
            load_dotenv(dotenv_path=env_backend, override=True)
        self.ai_api_key = (os.getenv("AI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")).strip()
        self.ai_model = os.getenv("AI_MODEL", "gemini-3.8-flash").strip()
        self.ai_base_url = os.getenv("AI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta").strip()
        default_db = "/tmp/prompts.db" if os.getenv("VERCEL") else str(BASE_DIR / "prompts.db")
        self.database_path = os.getenv("DATABASE_PATH", default_db).strip()

    def update_runtime(self, api_key: str = None, model: str = None):
        if api_key is not None:
            self.ai_api_key = api_key.strip()
            os.environ["AI_API_KEY"] = self.ai_api_key
        if model is not None:
            self.ai_model = model.strip()
            os.environ["AI_MODEL"] = self.ai_model

    @property
    def is_configured(self) -> bool:
        return bool(self.ai_api_key and len(self.ai_api_key) > 5)

    @property
    def masked_api_key(self) -> str:
        if not self.ai_api_key:
            return ""
        return "••••••••••••••••"

settings = Settings()
