import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.admin_credential import AdminCredential


TOKEN_LIFETIME_SECONDS = 60 * 60
PASSWORD_SCRYPT_N = 2**14
PASSWORD_SCRYPT_R = 8
PASSWORD_SCRYPT_P = 1


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    password_hash = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=PASSWORD_SCRYPT_N,
        r=PASSWORD_SCRYPT_R,
        p=PASSWORD_SCRYPT_P,
        dklen=64,
    )
    return "$".join(
        (
            "scrypt",
            str(PASSWORD_SCRYPT_N),
            str(PASSWORD_SCRYPT_R),
            str(PASSWORD_SCRYPT_P),
            _encode(salt),
            _encode(password_hash),
        )
    )


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        scheme, n, r, p, encoded_salt, encoded_digest = encoded_hash.split("$")
        if scheme != "scrypt":
            return False
        salt = _decode(encoded_salt)
        expected_digest = _decode(encoded_digest)
        actual_digest = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected_digest),
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(actual_digest, expected_digest)


def validate_new_password(password: str) -> None:
    if len(password) < 12:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="New password must be at least 12 characters long.",
        )
    if (
        not any(character.islower() for character in password)
        or not any(character.isupper() for character in password)
        or not any(character.isdigit() for character in password)
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=(
                "New password must include lowercase and uppercase letters "
                "and at least one number."
            ),
        )
    if any(character.isspace() for character in password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="New password must not contain whitespace.",
        )


def get_or_initialize_admin(db: Session) -> AdminCredential:
    credential = db.get(AdminCredential, 1)
    if credential is not None:
        return credential

    email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "")
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Administrator authentication is not configured.",
        )

    credential = AdminCredential(
        id=1,
        email=email,
        password_hash=hash_password(password),
        must_change_password=True,
        token_version=0,
    )
    db.add(credential)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        credential = db.get(AdminCredential, 1)
        if credential is None:
            raise
        return credential

    db.refresh(credential)
    return credential


def _signing_secret() -> bytes:
    secret = os.getenv("AUTH_SECRET", "")
    if len(secret) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured.",
        )
    return secret.encode("utf-8")


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def create_admin_token(email: str, token_version: int) -> str:
    now = int(time.time())
    claims = {
        "sub": email,
        "role": "admin",
        "ver": token_version,
        "iat": now,
        "exp": now + TOKEN_LIFETIME_SECONDS,
        "iss": "projecto-api",
    }
    encoded_claims = _encode(
        json.dumps(claims, separators=(",", ":")).encode("utf-8")
    )
    signature = hmac.new(
        _signing_secret(),
        encoded_claims.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{encoded_claims}.{_encode(signature)}"


def decode_admin_token(token: str) -> dict[str, Any]:
    try:
        encoded_claims, encoded_signature = token.split(".", maxsplit=1)
        claims = json.loads(_decode(encoded_claims))
        signature = _decode(encoded_signature)
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    expected_signature = hmac.new(
        _signing_secret(),
        encoded_claims.encode("ascii"),
        hashlib.sha256,
    ).digest()
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if (
        not isinstance(claims, dict)
        or claims.get("iss") != "projecto-api"
        or claims.get("role") != "admin"
        or not isinstance(claims.get("sub"), str)
        or not isinstance(claims.get("exp"), int)
        or claims["exp"] <= int(time.time())
        or not isinstance(claims.get("ver"), int)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return claims