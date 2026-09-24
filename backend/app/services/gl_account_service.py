from sqlalchemy.orm import Session

from app.models.gl_account import GLAccount
from app.repositories.gl_account_repository import (
    create_gl_account,
    get_gl_account_by_id,
    get_gl_accounts,
    update_gl_account,
    delete_gl_account,
)
from app.schemas.gl_account import GLAccountCreate


def create_account(
    db: Session,
    data: GLAccountCreate,
) -> GLAccount:
    gl_account = GLAccount(
        name=data.name,
        group_id=data.group_id,
        tax_applicable=data.tax_applicable,
        tax_type_id=data.tax_type_id,
        costing_applicable=data.costing_applicable,

        hsn_sac_type=data.hsn_sac_type,
        hsn_id=data.hsn_id,
        sac_id=data.sac_id,
        igst_rate=data.igst_rate,
        cgst_rate=data.cgst_rate,
        sgst_rate=data.sgst_rate,

        depreciation_applicable=data.depreciation_applicable,
        loan_taken_date=data.loan_taken_date,
        interest_rate=data.interest_rate,
        interest_effective_date=data.interest_effective_date,
        maintain_bill_wise=data.maintain_bill_wise,
        default_credit_days=data.default_credit_days,
        check_credit_days_on_voucher=data.check_credit_days_on_voucher,
    )

    return create_gl_account(db, gl_account)


def get_all_accounts(
    db: Session,
) -> list[GLAccount]:
    return get_gl_accounts(db)


def get_account(
    db: Session,
    account_id: int,
) -> GLAccount | None:
    return get_gl_account_by_id(db, account_id)


def update_account(
    db: Session,
    account_id: int,
    data: GLAccountCreate,
) -> GLAccount | None:
    gl_account = get_gl_account_by_id(db, account_id)

    if gl_account is None:
        return None

    gl_account.name = data.name
    gl_account.group_id = data.group_id
    gl_account.tax_applicable = data.tax_applicable
    gl_account.tax_type_id = data.tax_type_id
    gl_account.costing_applicable = data.costing_applicable

    gl_account.hsn_sac_type = data.hsn_sac_type
    gl_account.hsn_id = data.hsn_id
    gl_account.sac_id = data.sac_id
    gl_account.igst_rate = data.igst_rate
    gl_account.cgst_rate = data.cgst_rate
    gl_account.sgst_rate = data.sgst_rate

    gl_account.depreciation_applicable = data.depreciation_applicable
    gl_account.loan_taken_date = data.loan_taken_date
    gl_account.interest_rate = data.interest_rate
    gl_account.interest_effective_date = data.interest_effective_date
    gl_account.maintain_bill_wise = data.maintain_bill_wise
    gl_account.default_credit_days = data.default_credit_days
    gl_account.check_credit_days_on_voucher = (
        data.check_credit_days_on_voucher
    )

    return update_gl_account(db, gl_account)


def delete_account(
    db: Session,
    account_id: int,
) -> bool:
    gl_account = get_gl_account_by_id(db, account_id)

    if gl_account is None:
        return False

    delete_gl_account(db, gl_account)
    return True