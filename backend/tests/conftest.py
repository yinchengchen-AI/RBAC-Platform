import os
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

os.environ.setdefault("SKIP_DB_INIT", "1")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
