"""Account provisioning and credential verification."""

import hashlib
import hmac
import secrets

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import UserRole

_HASH_ALGORITHM = "pbkdf2_sha256"
_HASH_ITERATIONS = 600_000
_SALT_BYTES = 16
_VALID_ROLES = {"admin", "customer", "employee"}


def _hash_password(password: str, salt: bytes) -> str:
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        _HASH_ITERATIONS,
    )
    return f"{_HASH_ALGORITHM}${_HASH_ITERATIONS}${salt.hex()}${derived_key.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iteration_count, salt_hex, expected_hash = stored_hash.split("$")
        if algorithm != _HASH_ALGORITHM or int(iteration_count) != _HASH_ITERATIONS:
            return False
        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            _HASH_ITERATIONS,
        ).hex()
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(actual_hash, expected_hash)


def create_user(
    db: Session,
    *,
    email: str,
    name: str,
    password: str,
    role: UserRole,
) -> User:
    """Provision an account without exposing a public self-registration endpoint."""
    normalized_email = email.strip().casefold()
    normalized_name = name.strip()
    if not normalized_email or not normalized_name:
        raise ValueError("Email and name are required")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if role not in _VALID_ROLES:
        raise ValueError("Role must be admin, customer, or employee")
    if db.query(User).filter(User.email == normalized_email).first():
        raise ValueError("An account with this email already exists")

    user = User(
        email=normalized_email,
        name=normalized_name,
        role=role,
        password_hash=_hash_password(password, secrets.token_bytes(_SALT_BYTES)),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(
    db: Session,
    *,
    email: str,
    name: str,
    password: str,
    role: UserRole,
) -> User | None:
    normalized_email = email.strip().casefold()
    normalized_name = name.strip().casefold()
    user = db.query(User).filter(User.email == normalized_email).first()
    if user is None:
        return None

    password_matches = _verify_password(password, user.password_hash)
    identity_matches = (
        user.name.strip().casefold() == normalized_name
        and user.role == role
    )
    if not password_matches or not identity_matches:
        return None
    return user
