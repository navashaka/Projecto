from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.gl_account import (
    GLAccountCreate,
    GLAccountResponse,
)
from app.services.gl_account_service import (
    create_account,
    get_all_accounts,
    get_account,
    update_account,
    delete_account,
)

router = APIRouter(
    prefix="/gl-accounts",
    tags=["GL Accounts"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=GLAccountResponse,
)
def create_gl_account(
    data: GLAccountCreate,
    db: Session = Depends(get_db),
):
    return create_account(db, data)


@router.get(
    "/",
    response_model=list[GLAccountResponse],
)
def get_gl_accounts(
    db: Session = Depends(get_db),
):
    return get_all_accounts(db)


@router.get(
    "/{account_id}",
    response_model=GLAccountResponse,
)
def get_gl_account(
    account_id: int,
    db: Session = Depends(get_db),
):
    account = get_account(db, account_id)

    if account is None:
        raise HTTPException(
            status_code=404,
            detail="GL Account not found",
        )

    return account


@router.put(
    "/{account_id}",
    response_model=GLAccountResponse,
)
def update_gl_account(
    account_id: int,
    data: GLAccountCreate,
    db: Session = Depends(get_db),
):
    account = update_account(
        db,
        account_id,
        data,
    )

    if account is None:
        raise HTTPException(
            status_code=404,
            detail="GL Account not found",
        )

    return account


@router.delete(
    "/{account_id}",
)
def delete_gl_account(
    account_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_account(
        db,
        account_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="GL Account not found",
        )

    return {
        "message": "GL Account deleted successfully"
    }