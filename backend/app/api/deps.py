from collections.abc import Generator
import hmac
from typing import Any

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_admin_token
from app.models.admin_credential import AdminCredential


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def authenticate_admin(
    authorization: str | None,
    db: Session,
    *,
    allow_password_change: bool = False,
) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrator authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = decode_admin_token(authorization.removeprefix("Bearer ").strip())
    credential = db.get(AdminCredential, 1)
    if credential is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrator authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not hmac.compare_digest(
        claims["sub"].encode("utf-8"),
        credential.email.encode("utf-8"),
    ) or claims["ver"] != credential.token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if credential.must_change_password and not allow_password_change:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Change the temporary password before accessing this page.",
        )
    return {
        **claims,
        "must_change_password": credential.must_change_password,
    }


def require_admin(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    return authenticate_admin(authorization, db)


def require_authenticated_admin(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    return authenticate_admin(authorization, db, allow_password_change=True)
