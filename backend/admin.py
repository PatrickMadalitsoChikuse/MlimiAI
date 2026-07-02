"""Admin-only endpoints: analytics + user management.

All routes require an authenticated user whose email is listed in the
ADMIN_EMAILS env var (comma-separated).
"""

from __future__ import annotations

import secrets
import string
import time

from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash

from auth import get_db, is_admin_email, require_admin

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _row_to_user_dict(row) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "createdAt": row["created_at"],
        "disabled": bool(row["disabled"]),
        "isAdmin": is_admin_email(row["email"]),
    }


@admin_bp.get("/stats")
@require_admin
def stats():
    now = int(time.time())
    day = 86400
    since_30d = now - 30 * day

    with get_db() as conn:
        total_users = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
        total_chats = conn.execute("SELECT COUNT(*) AS c FROM chat_events").fetchone()["c"]
        token_sums = conn.execute(
            """
            SELECT COALESCE(SUM(prompt_tokens), 0) AS p,
                   COALESCE(SUM(completion_tokens), 0) AS c,
                   COALESCE(SUM(total_tokens), 0) AS t
            FROM chat_events
            """
        ).fetchone()

        signups_rows = conn.execute(
            """
            SELECT CAST(created_at / ? AS INTEGER) * ? AS day_bucket,
                   COUNT(*) AS count
            FROM users
            WHERE created_at >= ?
            GROUP BY day_bucket
            ORDER BY day_bucket
            """,
            (day, day, since_30d),
        ).fetchall()

        chat_rows = conn.execute(
            """
            SELECT CAST(created_at / ? AS INTEGER) * ? AS day_bucket,
                   COUNT(*) AS count
            FROM chat_events
            WHERE created_at >= ?
            GROUP BY day_bucket
            ORDER BY day_bucket
            """,
            (day, day, since_30d),
        ).fetchall()

        language_rows = conn.execute(
            """
            SELECT COALESCE(language, 'en') AS language,
                   COUNT(*) AS count
            FROM chat_events
            GROUP BY language
            ORDER BY count DESC
            """
        ).fetchall()

    return jsonify(
        {
            "totals": {
                "users": total_users,
                "chats": total_chats,
                "promptTokens": token_sums["p"],
                "completionTokens": token_sums["c"],
                "totalTokens": token_sums["t"],
            },
            "signupsByDay": [
                {"ts": r["day_bucket"], "count": r["count"]} for r in signups_rows
            ],
            "chatsByDay": [
                {"ts": r["day_bucket"], "count": r["count"]} for r in chat_rows
            ],
            "languageSplit": [
                {"language": r["language"], "count": r["count"]} for r in language_rows
            ],
        }
    )


@admin_bp.get("/users")
@require_admin
def list_users():
    q = (request.args.get("q") or "").strip().lower()
    with get_db() as conn:
        if q:
            like = f"%{q}%"
            rows = conn.execute(
                """
                SELECT id, email, name, created_at, disabled
                FROM users
                WHERE LOWER(email) LIKE ? OR LOWER(name) LIKE ?
                ORDER BY created_at DESC
                """,
                (like, like),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id, email, name, created_at, disabled FROM users ORDER BY created_at DESC"
            ).fetchall()
    return jsonify({"users": [_row_to_user_dict(r) for r in rows]})


@admin_bp.patch("/users/<int:user_id>")
@require_admin
def update_user(user_id: int):
    body = request.get_json(silent=True) or {}
    fields = []
    values: list = []
    if "disabled" in body:
        fields.append("disabled = ?")
        values.append(1 if body["disabled"] else 0)
    if "name" in body and isinstance(body["name"], str) and body["name"].strip():
        fields.append("name = ?")
        values.append(body["name"].strip())
    if not fields:
        return jsonify({"error": "no fields to update"}), 400
    values.append(user_id)

    with get_db() as conn:
        cur = conn.execute(
            f"UPDATE users SET {', '.join(fields)} WHERE id = ?", tuple(values)
        )
        if cur.rowcount == 0:
            return jsonify({"error": "user not found"}), 404
        row = conn.execute(
            "SELECT id, email, name, created_at, disabled FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    return jsonify({"user": _row_to_user_dict(row)})


@admin_bp.delete("/users/<int:user_id>")
@require_admin
def delete_user(user_id: int):
    with get_db() as conn:
        cur = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        if cur.rowcount == 0:
            return jsonify({"error": "user not found"}), 404
    return jsonify({"ok": True})


def _temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@admin_bp.post("/users/<int:user_id>/reset-password")
@require_admin
def reset_password(user_id: int):
    new_password = _temp_password()
    pw_hash = generate_password_hash(new_password)
    with get_db() as conn:
        cur = conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?", (pw_hash, user_id)
        )
        if cur.rowcount == 0:
            return jsonify({"error": "user not found"}), 404
    # Returned once to the admin — copy and share with the user out-of-band.
    return jsonify({"tempPassword": new_password})
