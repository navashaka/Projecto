from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.gl_bank_account import (
    GLBankAccountCreate,
    GLBankAccountResponse,
)
from app.services.gl_bank_account_service import (
    create_bank_account,
    get_all_bank_accounts,
    get_bank_account,
    update_bank_account,
    delete_bank_account,
)

router = APIRouter(
    prefix="/gl-bank-accounts",
    tags=["GL Bank Accounts"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=GLBankAccountResponse,
)
def create_gl_bank_account(
    data: GLBankAccountCreate,
    db: Session = Depends(get_db),
):
    return create_bank_account(db, data)


@router.get(
    "/",
    response_model=list[GLBankAccountResponse],
)
def get_gl_bank_accounts(
    db: Session = Depends(get_db),
):
    return get_all_bank_accounts(db)


@router.get(
    "/{bank_account_id}",
    response_model=GLBankAccountResponse,
)
def get_gl_bank_account(
    bank_account_id: int,
    db: Session = Depends(get_db),
):
    bank_account = get_bank_account(
        db,
        bank_account_id,
    )

    if bank_account is None:
        raise HTTPException(
            status_code=404,
            detail="GL Bank Account not found",
        )

    return bank_account


@router.put(
    "/{bank_account_id}",
    response_model=GLBankAccountResponse,
)
def update_gl_bank_account(
    bank_account_id: int,
    data: GLBankAccountCreate,
    db: Session = Depends(get_db),
):
    bank_account = update_bank_account(
        db,
        bank_account_id,
        data,
    )

    if bank_account is None:
        raise HTTPException(
            status_code=404,
            detail="GL Bank Account not found",
        )

    return bank_account


@router.delete(
    "/{bank_account_id}",
)
def delete_gl_bank_account(
    bank_account_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_bank_account(
        db,
        bank_account_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="GL Bank Account not found",
        )

    return {
        "message": "GL Bank Account deleted successfully"
    }