import hmac
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.api.deps import (
    get_db,
    require_authenticated_admin,
)
from app.core.security import (
    create_admin_token,
    get_or_initialize_admin,
    hash_password,
    validate_new_password,
    verify_password,
)
from app.models.admin_credential import AdminCredential


router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=1024)


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    email: str
    role: Literal["admin"] = "admin"
    must_change_password: bool
    expires_in: int = 3600


class PasswordChangeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(min_length=1, max_length=1024)
    new_password: str = Field(min_length=1, max_length=1024)
    confirm_new_password: str = Field(min_length=1, max_length=1024)


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> LoginResponse:
    credential = get_or_initialize_admin(db)
    email_matches = hmac.compare_digest(
        payload.email.strip().lower().encode("utf-8"),
        credential.email.encode("utf-8"),
    )
    password_matches = verify_password(payload.password, credential.password_hash)
    if not email_matches or not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return LoginResponse(
        access_token=create_admin_token(
            credential.email,
            credential.token_version,
        ),
        email=credential.email,
        must_change_password=credential.must_change_password,
    )


@router.get("/me")
def get_current_user(
    claims: dict = Depends(require_authenticated_admin),
) -> dict[str, str | bool]:
    return {
        "email": claims["sub"],
        "role": claims["role"],
        "must_change_password": claims["must_change_password"],
    }


@router.post("/change-password")
def change_password(
    payload: PasswordChangeRequest,
    claims: dict = Depends(require_authenticated_admin),
    db: Session = Depends(get_db),
) -> LoginResponse:
    credential = db.get(AdminCredential, 1)
    if credential is None or credential.email != claims["sub"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrator authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(payload.current_password, credential.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    if payload.new_password != payload.confirm_new_password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="New password and confirmation do not match.",
        )
    if hmac.compare_digest(
        payload.current_password.encode("utf-8"),
        payload.new_password.encode("utf-8"),
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="New password must be different from the current password.",
        )
    validate_new_password(payload.new_password)

    credential.password_hash = hash_password(payload.new_password)
    credential.must_change_password = False
    credential.token_version += 1
    credential.password_changed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(credential)
    return LoginResponse(
        access_token=create_admin_token(
            credential.email,
            credential.token_version,
        ),
        email=credential.email,
        must_change_password=False,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_admin(
    claims: dict = Depends(require_authenticated_admin),
    db: Session = Depends(get_db),
) -> None:
    credential = db.get(AdminCredential, 1)
    if credential is None or credential.email != claims["sub"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrator authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    credential.token_version += 1
    db.commit()
