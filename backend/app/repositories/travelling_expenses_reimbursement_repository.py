from sqlalchemy.orm import Session

from app.models.travelling_expenses_reimbursement import (
    TravellingExpensesReimbursement,
)


def create_reimbursement(
    db: Session,
    data: TravellingExpensesReimbursement,
):
    db.add(data)
    db.commit()
    db.refresh(data)
    return data


def get_reimbursement(
    db: Session,
    reimbursement_id: int,
):
    return (
        db.query(TravellingExpensesReimbursement)
        .filter(
            TravellingExpensesReimbursement.id == reimbursement_id
        )
        .first()
    )