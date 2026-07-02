"""Lightweight auth for the Mlimi AI backend.

SQLite for storage, werkzeug for password hashing, PyJWT for tokens.
Designed to be small and easy to swap for a real auth provider later.
"""

from __future__ import annotations

import os
import re
import sqlite3
import time
from functools import wraps
from typing import Optional

import jwt
from flask import Blueprint, current_app, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

DB_PATH = os.environ.get("MLIMI_DB", os.path.join(os.path.dirname(__file__), "mlimi.db"))
JWT_SECRET = os.environ.get(
    "JWT_SECRET",
    "dev-secret-change-me-this-must-be-at-least-32-bytes-long-please",
)
JWT_ALG = "HS256"
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


DEFAULT_ADMIN_EMAIL = os.environ.get("DEFAULT_ADMIN_EMAIL", "admin@mlimi.local")
DEFAULT_ADMIN_NAME = os.environ.get("DEFAULT_ADMIN_NAME", "Mlimi Admin")
DEFAULT_ADMIN_PASSWORD = os.environ.get("DEFAULT_ADMIN_PASSWORD", "admin12345")

DEFAULT_USER_EMAIL = os.environ.get("DEFAULT_USER_EMAIL", "farmer@mlimi.local")
DEFAULT_USER_NAME = os.environ.get("DEFAULT_USER_NAME", "Test Farmer")
DEFAULT_USER_PASSWORD = os.environ.get("DEFAULT_USER_PASSWORD", "farmer12345")


def _admin_emails() -> set[str]:
    raw = os.environ.get("ADMIN_EMAILS", "")
    explicit = {e.strip().lower() for e in raw.split(",") if e.strip()}
    # The seeded default admin is always an admin, even if ADMIN_EMAILS is unset.
    explicit.add(DEFAULT_ADMIN_EMAIL.lower())
    return explicit


def is_admin_email(email: str | None) -> bool:
    return bool(email) and email.lower() in _admin_emails()


def _create_user_if_missing(conn, email: str, name: str, password: str) -> None:
    row = conn.execute("SELECT id FROM users WHERE email = ?", (email.lower(),)).fetchone()
    if row:
        return
    conn.execute(
        "INSERT INTO users (email, name, password_hash, created_at, disabled) "
        "VALUES (?, ?, ?, ?, 0)",
        (email.lower(), name, generate_password_hash(password), int(time.time())),
    )


def seed_defaults() -> None:
    """Create default admin + test user if they don't exist. Idempotent."""
    with get_db() as conn:
        _create_user_if_missing(
            conn, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_PASSWORD
        )
        if os.environ.get("SEED_DEFAULT_USER", "1") != "0":
            _create_user_if_missing(
                conn, DEFAULT_USER_EMAIL, DEFAULT_USER_NAME, DEFAULT_USER_PASSWORD
            )


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                email        TEXT    UNIQUE NOT NULL,
                name         TEXT    NOT NULL,
                password_hash TEXT   NOT NULL,
                created_at   INTEGER NOT NULL
            )
            """
        )
        existing_user_cols = {
            r["name"] for r in conn.execute("PRAGMA table_info(users)").fetchall()
        }
        if "disabled" not in existing_user_cols:
            conn.execute(
                "ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0"
            )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_events (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id           INTEGER,
                language          TEXT,
                prompt_tokens     INTEGER DEFAULT 0,
                completion_tokens INTEGER DEFAULT 0,
                total_tokens      INTEGER DEFAULT 0,
                model             TEXT,
                created_at        INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_chat_events_created_at ON chat_events(created_at)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_chat_events_user_id ON chat_events(user_id)"
        )


def issue_token(user_id: int, email: str) -> str:
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": now,
        "exp": now + TOKEN_TTL_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None


def current_user() -> Optional[sqlite3.Row]:
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    payload = decode_token(auth.split(" ", 1)[1].strip())
    if not payload:
        return None
    try:
        uid = int(payload.get("sub", "0"))
    except (TypeError, ValueError):
        return None
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, email, name, created_at, disabled FROM users WHERE id = ?",
            (uid,),
        ).fetchone()
    return row


def require_auth(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user:
            return jsonify({"error": "unauthorized"}), 401
        if user["disabled"]:
            return jsonify({"error": "account suspended"}), 403
        g.user = user
        return view(*args, **kwargs)

    return wrapper


def require_admin(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user:
            return jsonify({"error": "unauthorized"}), 401
        if user["disabled"]:
            return jsonify({"error": "account suspended"}), 403
        if not is_admin_email(user["email"]):
            return jsonify({"error": "forbidden"}), 403
        g.user = user
        return view(*args, **kwargs)

    return wrapper


def _user_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "createdAt": row["created_at"],
        "disabled": bool(row["disabled"]) if "disabled" in row.keys() else False,
        "isAdmin": is_admin_email(row["email"]),
    }


@auth_bp.post("/signup")
def signup():
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    name = (body.get("name") or "").strip()
    password = body.get("password") or ""

    if not EMAIL_RE.match(email):
        return jsonify({"error": "Invalid email address."}), 400
    if not name or len(name) < 2:
        return jsonify({"error": "Please enter your name."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    pw_hash = generate_password_hash(password)
    now = int(time.time())
    try:
        with get_db() as conn:
            cur = conn.execute(
                "INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)",
                (email, name, pw_hash, now),
            )
            uid = cur.lastrowid
            row = conn.execute(
                "SELECT id, email, name, created_at, disabled FROM users WHERE id = ?",
                (uid,),
            ).fetchone()
    except sqlite3.IntegrityError:
        return jsonify({"error": "An account with that email already exists."}), 409

    token = issue_token(row["id"], row["email"])
    return jsonify({"token": token, "user": _user_to_dict(row)}), 201


@auth_bp.post("/login")
def login():
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    with get_db() as conn:
        row = conn.execute(
            "SELECT id, email, name, password_hash, created_at, disabled FROM users WHERE email = ?",
            (email,),
        ).fetchone()

    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401
    if row["disabled"]:
        return jsonify({"error": "This account has been suspended."}), 403

    token = issue_token(row["id"], row["email"])
    return jsonify({"token": token, "user": _user_to_dict(row)})


@auth_bp.get("/me")
@require_auth
def me():
    return jsonify({"user": _user_to_dict(g.user)})


@auth_bp.patch("/me")
@require_auth
def update_me():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name or len(name) < 2:
        return jsonify({"error": "Please enter your name."}), 400

    with get_db() as conn:
        conn.execute("UPDATE users SET name = ? WHERE id = ?", (name, g.user["id"]))
        row = conn.execute(
            "SELECT id, email, name, created_at, disabled FROM users WHERE id = ?",
            (g.user["id"],),
        ).fetchone()
    return jsonify({"user": _user_to_dict(row)})


@auth_bp.post("/change-password")
@require_auth
def change_password():
    body = request.get_json(silent=True) or {}
    current = body.get("currentPassword") or ""
    new = body.get("newPassword") or ""
    if len(new) < 8:
        return jsonify({"error": "New password must be at least 8 characters."}), 400

    with get_db() as conn:
        row = conn.execute(
            "SELECT password_hash FROM users WHERE id = ?", (g.user["id"],)
        ).fetchone()
        if not row or not check_password_hash(row["password_hash"], current):
            return jsonify({"error": "Current password is incorrect."}), 400
        conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (generate_password_hash(new), g.user["id"]),
        )
    return jsonify({"ok": True})


@auth_bp.delete("/me")
@require_auth
def delete_me():
    body = request.get_json(silent=True) or {}
    password = body.get("password") or ""

    with get_db() as conn:
        row = conn.execute(
            "SELECT password_hash FROM users WHERE id = ?", (g.user["id"],)
        ).fetchone()
        if not row or not check_password_hash(row["password_hash"], password):
            return jsonify({"error": "Password is incorrect."}), 400
        conn.execute("DELETE FROM users WHERE id = ?", (g.user["id"],))
    return jsonify({"ok": True})
