from sqlalchemy.orm import Session

from app.models.gl_bank_account import GLBankAccount


def create_gl_bank_account(
    db: Session,
    bank_account: GLBankAccount,
) -> GLBankAccount:
    db.add(bank_account)
    db.commit()
    db.refresh(bank_account)
    return bank_account


def get_gl_bank_accounts(
    db: Session,
) -> list[GLBankAccount]:
    return db.query(GLBankAccount).all()


def get_gl_bank_account_by_id(
    db: Session,
    bank_account_id: int,
) -> GLBankAccount | None:
    return (
        db.query(GLBankAccount)
        .filter(GLBankAccount.id == bank_account_id)
        .first()
    )


def update_gl_bank_account(
    db: Session,
    bank_account: GLBankAccount,
) -> GLBankAccount:
    db.commit()
    db.refresh(bank_account)
    return bank_account


def delete_gl_bank_account(
    db: Session,
    bank_account: GLBankAccount,
) -> None:
    db.delete(bank_account)
    db.commit()