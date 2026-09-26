"""
Public feedback storage. Uses the same storage pattern as auth.py: Turso
when TURSO_DATABASE_URL/TURSO_AUTH_TOKEN are set, local sqlite otherwise.

Rate limiting: a simple, real per-IP sliding window (max 5 submissions
per IP per hour), enforced by counting recent rows for that IP - not a
placeholder. This is enough to stop spam/abuse of a public form; if you
need something more robust at scale (distributed deployment, multiple
backend instances), move this to Redis or a dedicated rate-limit service.
"""
import os
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "feedback.db")

TURSO_URL = os.environ.get("TURSO_DATABASE_URL")
TURSO_TOKEN = os.environ.get("TURSO_AUTH_TOKEN")
USING_TURSO = bool(TURSO_URL)

RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW_HOURS = 1

_CREATE_TABLE_SQL = """
    CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        category TEXT NOT NULL,
        message TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
"""


class _SqliteBackend:
    def _connect(self) -> sqlite3.Connection:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        conn.execute(_CREATE_TABLE_SQL)
        return conn

    def insert(self, row: tuple) -> None:
        conn = self._connect()
        try:
            conn.execute(
                "INSERT INTO feedback (name, email, category, message, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                row,
            )
            conn.commit()
        finally:
            conn.close()

    def count_recent_from_ip(self, ip: str, since_iso: str) -> int:
        conn = self._connect()
        try:
            row = conn.execute(
                "SELECT COUNT(*) FROM feedback WHERE ip_address = ? AND created_at > ?", (ip, since_iso)
            ).fetchone()
            return row[0] if row else 0
        finally:
            conn.close()

    def list_all(self) -> list:
        conn = self._connect()
        try:
            rows = conn.execute(
                "SELECT id, name, email, category, message, created_at FROM feedback ORDER BY created_at DESC LIMIT 200"
            ).fetchall()
            return [dict(zip(["id", "name", "email", "category", "message", "created_at"], r)) for r in rows]
        finally:
            conn.close()


class _TursoBackend:
    def __init__(self):
        import libsql_client
        self._libsql_client = libsql_client
        with self._client() as client:
            client.execute(_CREATE_TABLE_SQL)

    def _client(self):
        return self._libsql_client.create_client_sync(TURSO_URL, auth_token=TURSO_TOKEN)

    def insert(self, row: tuple) -> None:
        with self._client() as client:
            client.execute(
                "INSERT INTO feedback (name, email, category, message, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                list(row),
            )

    def count_recent_from_ip(self, ip: str, since_iso: str) -> int:
        with self._client() as client:
            rs = client.execute(
                "SELECT COUNT(*) FROM feedback WHERE ip_address = ? AND created_at > ?", [ip, since_iso]
            )
            return rs.rows[0][0] if rs.rows else 0

    def list_all(self) -> list:
        with self._client() as client:
            rs = client.execute(
                "SELECT id, name, email, category, message, created_at FROM feedback ORDER BY created_at DESC LIMIT 200"
            )
            return [dict(zip(["id", "name", "email", "category", "message", "created_at"], r)) for r in rs.rows]


_backend = _TursoBackend() if USING_TURSO else _SqliteBackend()


def submit_feedback(name: Optional[str], email: Optional[str], category: str, message: str, ip: str) -> None:
    _backend.insert((name, email, category, message, ip, datetime.now(timezone.utc).isoformat()))


def is_rate_limited(ip: str) -> bool:
    since = (datetime.now(timezone.utc) - timedelta(hours=RATE_LIMIT_WINDOW_HOURS)).isoformat()
    return _backend.count_recent_from_ip(ip, since) >= RATE_LIMIT_MAX


def list_feedback() -> list:
    return _backend.list_all()
