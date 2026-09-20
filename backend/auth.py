"""
Authority login system.

Storage: plain sqlite3 by default (backend/data/auth.db, created
automatically). To use Turso instead, set two environment variables and
nothing else in this file needs to change conceptually - see the note at
the bottom of this file for the swap.

Passwords are hashed with bcrypt (never stored in plain text). Sessions
are stateless JWTs signed with AUTH_SECRET (set this env var in
production - a random default is used otherwise, which invalidates all
sessions on every restart and is NOT safe to deploy as-is).

There is deliberately no public self-registration endpoint. Authority
accounts are created with create_admin.py, run by whoever administers the
deployment - the same way a real government system's internal accounts
aren't something the public can sign up for.
"""
import os
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Header, HTTPException

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "auth.db")
AUTH_SECRET = os.environ.get("AUTH_SECRET", "dev-only-insecure-secret-change-me")
TOKEN_TTL_HOURS = 12


def _connect() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'authority',
            created_at TEXT NOT NULL
        )
    """)
    return conn


def create_user(username: str, password: str, role: str = "authority") -> None:
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
            (username, password_hash, role, datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
    finally:
        conn.close()


def verify_login(username: str, password: str) -> Optional[dict]:
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT id, username, password_hash, role FROM users WHERE username = ?", (username,)
        ).fetchone()
    finally:
        conn.close()
    if not row:
        return None
    user_id, uname, password_hash, role = row
    if not bcrypt.checkpw(password.encode(), password_hash.encode()):
        return None
    return {"id": user_id, "username": uname, "role": role}


def get_user_by_username(username: str) -> Optional[dict]:
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT id, username, role FROM users WHERE username = ?", (username,)
        ).fetchone()
    finally:
        conn.close()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "role": row[2]}


def issue_token(user: dict) -> str:
    payload = {
        "sub": user["username"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS),
    }
    return jwt.encode(payload, AUTH_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, AUTH_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session token")


def require_auth(authorization: Optional[str] = Header(None)) -> dict:
    """FastAPI dependency: use as `user = Depends(require_auth)` on any
    route that should only work for a logged-in authority user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    return decode_token(token)


# --- Swapping local sqlite for Turso -----------------------------------
# Turso databases speak the sqlite wire protocol over libsql. To use your
# Turso database instead of the local file:
#   pip install libsql-experimental
#   Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN as environment variables.
#   Replace `_connect()` above with:
#       import libsql_experimental as libsql
#       conn = libsql.connect(
#           os.environ["TURSO_DATABASE_URL"],
#           auth_token=os.environ["TURSO_AUTH_TOKEN"],
#       )
# Everything else in this file (create_user, verify_login, issue_token,
# decode_token, require_auth) stays the same, since libsql's Python client
# mirrors the sqlite3 API closely.
