from sqlalchemy.orm import Session

from .models import Payroll


def create_payroll(
    db: Session,
    payroll: Payroll,
) -> Payroll:
    db.add(payroll)
    db.commit()
    db.refresh(payroll)

    return payroll


def get_payroll(
    db: Session,
    payroll_id: int,
) -> Payroll | None:
    return (
        db.query(Payroll)
        .filter(Payroll.id == payroll_id)
        .first()
    )