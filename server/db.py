import sqlite3
from contextlib import contextmanager

from config import DB_PATH


def init_db() -> None:
    with connect() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                persona_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS personas (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                title TEXT,
                system_prompt TEXT NOT NULL,
                about TEXT,
                greeting TEXT,
                personality TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        for col in ("about", "greeting", "persona_id"):
            try:
                cur.execute(f"ALTER TABLE conversations ADD COLUMN {col} TEXT")
            except sqlite3.OperationalError:
                pass
        for col in ("about", "greeting", "personality", "title"):
            try:
                cur.execute(f"ALTER TABLE personas ADD COLUMN {col} TEXT")
            except sqlite3.OperationalError:
                pass
        for col in ("regenerate_count", "regenerate_index"):
            try:
                cur.execute(f"ALTER TABLE messages ADD COLUMN {col} INTEGER DEFAULT 0")
            except sqlite3.OperationalError:
                pass
        conn.commit()


@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
