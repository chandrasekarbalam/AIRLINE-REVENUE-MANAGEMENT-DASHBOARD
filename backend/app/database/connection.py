import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager

# Base directory for DB
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DB_DIR = PROJECT_ROOT / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "airline_revenue.db"

def get_db_path() -> Path:
    return DB_PATH

@contextmanager
def get_db():
    """Context manager for SQLite database connection."""
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def query_all(query: str, params: tuple = ()) -> list[dict]:
    """Helper to query and return a list of dictionaries."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def query_one(query: str, params: tuple = ()) -> dict | None:
    """Helper to query single row as dictionary."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None

def execute_write(query: str, params: tuple = ()) -> int:
    """Helper to execute write and return lastrowid or rowcount."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        return cursor.lastrowid
