from sqlalchemy.orm import Session

from app.models.gl_account import GLAccount


def create_gl_account(
    db: Session,
    gl_account: GLAccount,
) -> GLAccount:
    db.add(gl_account)
    db.commit()
    db.refresh(gl_account)
    return gl_account


def get_gl_accounts(
    db: Session,
) -> list[GLAccount]:
    return db.query(GLAccount).all()


def get_gl_account_by_id(
    db: Session,
    account_id: int,
) -> GLAccount | None:
    return (
        db.query(GLAccount)
        .filter(GLAccount.id == account_id)
        .first()
    )


def update_gl_account(
    db: Session,
    gl_account: GLAccount,
) -> GLAccount:
    db.commit()
    db.refresh(gl_account)
    return gl_account


def delete_gl_account(
    db: Session,
    gl_account: GLAccount,
) -> None:
    db.delete(gl_account)
    db.commit()