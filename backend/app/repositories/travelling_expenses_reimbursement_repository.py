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


def get_all_reimbursements(db: Session):
    return db.query(TravellingExpensesReimbursement).all()


def update_reimbursement(db: Session, reimbursement_id: int, payload: dict):
    reimbursement = get_reimbursement(db, reimbursement_id)
    if not reimbursement:
        return None

    for field, value in payload.items():
        setattr(reimbursement, field, value)

    db.commit()
    db.refresh(reimbursement)
    return reimbursement


def delete_reimbursement(db: Session, reimbursement_id: int) -> bool:
    reimbursement = get_reimbursement(db, reimbursement_id)
    if not reimbursement:
        return False

    db.delete(reimbursement)
    db.commit()
    return True