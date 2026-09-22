from sqlalchemy.orm import Session

from app.models.gl_bank_account import GLBankAccount
from app.repositories.gl_bank_account_repository import (
    create_gl_bank_account,
    get_gl_bank_accounts,
    get_gl_bank_account_by_id,
    update_gl_bank_account,
    delete_gl_bank_account,
)
from app.schemas.gl_bank_account import GLBankAccountCreate


def create_bank_account(
    db: Session,
    data: GLBankAccountCreate,
) -> GLBankAccount:
    bank_account = GLBankAccount(
        account_holder_name=data.account_holder_name,
        account_number=data.account_number,
        bank_name=data.bank_name,
        branch=data.branch,
        ifsc_code=data.ifsc_code,
        swift_code=data.swift_code,
        enable_cheque_issue=data.enable_cheque_issue,
        reconciliation_start_date=data.reconciliation_start_date,
        enable_e_payments=data.enable_e_payments,
    )

    return create_gl_bank_account(db, bank_account)


def get_all_bank_accounts(
    db: Session,
) -> list[GLBankAccount]:
    return get_gl_bank_accounts(db)


def get_bank_account(
    db: Session,
    bank_account_id: int,
) -> GLBankAccount | None:
    return get_gl_bank_account_by_id(
        db,
        bank_account_id,
    )


def update_bank_account(
    db: Session,
    bank_account_id: int,
    data: GLBankAccountCreate,
) -> GLBankAccount | None:
    bank_account = get_gl_bank_account_by_id(
        db,
        bank_account_id,
    )

    if bank_account is None:
        return None

    bank_account.account_holder_name = data.account_holder_name
    bank_account.account_number = data.account_number
    bank_account.bank_name = data.bank_name
    bank_account.branch = data.branch
    bank_account.ifsc_code = data.ifsc_code
    bank_account.swift_code = data.swift_code
    bank_account.enable_cheque_issue = data.enable_cheque_issue
    bank_account.reconciliation_start_date = (
        data.reconciliation_start_date
    )
    bank_account.enable_e_payments = data.enable_e_payments

    return update_gl_bank_account(
        db,
        bank_account,
    )


def delete_bank_account(
    db: Session,
    bank_account_id: int,
) -> bool:
    bank_account = get_gl_bank_account_by_id(
        db,
        bank_account_id,
    )

    if bank_account is None:
        return False

    delete_gl_bank_account(
        db,
        bank_account,
    )

    return True