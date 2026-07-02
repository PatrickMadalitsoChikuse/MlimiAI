"""Africa's Talking USSD flows for user signup and login.

Africa's Talking sends form-encoded POSTs with at least:
- sessionId
- serviceCode
- phoneNumber
- text

Responses must be plain text beginning with:
- CON to continue the USSD session
- END to finish the USSD session
"""

from __future__ import annotations

import re
import sqlite3
import time

from flask import Blueprint, Response, current_app, request
from werkzeug.security import check_password_hash, generate_password_hash

from auth import get_db

ussd_bp = Blueprint("ussd", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def ussd_response(message: str, continue_session: bool = True) -> Response:
    prefix = "CON" if continue_session else "END"
    return Response(f"{prefix} {message}", mimetype="text/plain")


def ussd_safe_text(text: str, max_chars: int = 420) -> str:
    cleaned = " ".join((text or "").split())
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[: max_chars - 1].rsplit(" ", 1)[0].rstrip(".,;:") + "…"


def normalise_phone(phone: str) -> str:
    return (phone or "").strip()


def default_email_for_phone(phone: str) -> str:
    digits = re.sub(r"\D+", "", phone)
    if not digits:
        digits = str(int(time.time()))
    return f"ussd-{digits}@mlimi.local"


def find_user_by_email(email: str):
    with get_db() as conn:
        return conn.execute(
            "SELECT id, email, name, password_hash, disabled FROM users WHERE email = ?",
            (email.lower(),),
        ).fetchone()


def create_user(name: str, email: str, password: str) -> tuple[bool, str]:
    if not name or len(name.strip()) < 2:
        return False, "Name must be at least 2 characters."
    if not EMAIL_RE.match(email):
        return False, "Invalid email address."
    if len(password) < 4:
        return False, "PIN must be at least 4 digits."

    try:
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO users (email, name, password_hash, created_at, disabled)
                VALUES (?, ?, ?, ?, 0)
                """,
                (
                    email.lower(),
                    name.strip(),
                    generate_password_hash(password),
                    int(time.time()),
                ),
            )
    except sqlite3.IntegrityError:
        return False, "An account with that email already exists."

    return True, "Registration successful. You can now log in from USSD or the web app."


def login_user(email: str, password: str) -> tuple[bool, str]:
    row = find_user_by_email(email)
    if not row or not check_password_hash(row["password_hash"], password):
        return False, "Invalid email or PIN."
    if row["disabled"]:
        return False, "This account has been suspended."
    return True, f"Welcome back, {row['name']}! Login successful."


@ussd_bp.post("/ussd")
def ussd():
    phone_number = normalise_phone(request.form.get("phoneNumber", ""))
    text = (request.form.get("text") or "").strip()
    parts = text.split("*") if text else []

    if not parts:
        return ussd_response(
            "Welcome to Mlimi AI\n"
            "1. Register\n"
            "2. Login"
        )

    choice = parts[0]

    if choice == "1":
        return handle_register(parts, phone_number)
    if choice == "2":
        return handle_login(parts, phone_number)

    return ussd_response("Invalid option. Please try again.", continue_session=False)


def handle_register(parts: list[str], phone_number: str) -> Response:
    email = default_email_for_phone(phone_number)

    if find_user_by_email(email):
        return ussd_response(
            "This phone number is already registered.\n"
            "Go back and choose 2 to login.",
            continue_session=False,
        )

    if len(parts) == 1:
        return ussd_response("Register\nEnter your full name:")
    if len(parts) == 2:
        return ussd_response("Create a 4+ digit PIN:")

    name = parts[1].strip()
    pin = parts[2].strip()

    ok, message = create_user(name, email, pin)
    if ok:
        message = "Registration successful. You can now login using this phone number and PIN."
    return ussd_response(message, continue_session=False)


def handle_login(parts: list[str], phone_number: str) -> Response:
    email = default_email_for_phone(phone_number)

    if len(parts) == 1:
        return ussd_response("Login\nEnter your PIN:")

    pin = parts[1].strip()
    ok, message = login_user(email, pin)
    if not ok and message == "Invalid email or PIN.":
        message = "Invalid PIN or phone number not registered. Choose 1 to register first."
        return ussd_response(message, continue_session=False)
    if not ok:
        return ussd_response(message, continue_session=False)

    row = find_user_by_email(email)
    name = row["name"] if row else "farmer"

    if len(parts) >= 3:
        return handle_authenticated_menu(parts, phone_number)

    return ussd_response(
        f"Welcome back, {name}.\n"
        "Ask your farming question, or type 0 to exit:"
    )


def handle_authenticated_menu(parts: list[str], phone_number: str) -> Response:
    # After login, Africa's Talking appends every user input to text:
    # 2*PIN*first question*second question*0
    # Treat each input after the PIN as a free-text question, except 0 exits.
    inputs = [item.strip() for item in parts[2:] if item.strip()]
    if not inputs:
        return ussd_response("Ask your farming question, or type 0 to exit:")

    latest_input = inputs[-1]
    if latest_input == "0":
        return ussd_response("Thank you for using Mlimi AI.", continue_session=False)

    if len(latest_input) < 3:
        return ussd_response(
            "Please enter a longer farming question, or type 0 to exit:",
            continue_session=True,
        )

    answer = answer_question_for_phone(latest_input, phone_number)
    return ussd_response(
        f"{ussd_safe_text(answer)}\n\n"
        "Ask another question, or type 0 to exit:",
        continue_session=True,
    )


def answer_question_for_phone(question: str, phone_number: str) -> str:
    email = default_email_for_phone(phone_number)
    row = find_user_by_email(email)
    if not row:
        raise ValueError("Phone number not registered.")
    if row["disabled"]:
        raise ValueError("This account has been suspended.")

    try:
        return current_app.config["USSD_CHAT_HANDLER"](
            question=question,
            user_id=row["id"],
        )
    except Exception:
        return "Mlimi AI is temporarily unavailable. Please try again later."
