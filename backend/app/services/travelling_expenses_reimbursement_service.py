from sqlalchemy.orm import Session

from app.models.travelling_expenses_reimbursement import (
    TravellingExpensesReimbursement,
)
from app.schemas.travelling_expenses_reimbursement import (
    TravellingExpensesReimbursementCreate,
)
from app.repositories.travelling_expenses_reimbursement_repository import (
    create_reimbursement,
    get_reimbursement,
)


def create_reimbursement_service(
    db: Session,
    data: TravellingExpensesReimbursementCreate,
):
    reimbursement = TravellingExpensesReimbursement(**data.model_dump())

    return create_reimbursement(db, reimbursement)


def get_reimbursement_service(
    db: Session,
    reimbursement_id: int,
):
    return get_reimbursement(db, reimbursement_id)