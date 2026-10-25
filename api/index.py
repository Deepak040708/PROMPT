import os
import sys
from pathlib import Path

# Setup paths so backend modules can be imported directly
API_DIR = Path(__file__).resolve().parent
ROOT_DIR = API_DIR.parent
BACKEND_DIR = ROOT_DIR / "backend"

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# On Vercel serverless environment, the filesystem is read-only except /tmp
# Redirect SQLite database to /tmp if running in serverless environment
if os.getenv("VERCEL") or not os.access(str(ROOT_DIR), os.W_OK):
    os.environ.setdefault("DATABASE_PATH", "/tmp/prompts.db")

from backend.app.main import app
from backend.app.database import init_db

# Initialize database schema in /tmp on function warm-up
try:
    init_db()
except Exception as e:
    print(f"[Vercel Function] Database init notice: {e}")
