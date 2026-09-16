from sqlalchemy.orm import Session

from app.models.travelling_expenses_reimbursement import (
    TravellingExpensesReimbursement,
)
from app.schemas.travelling_expenses_reimbursement import (
    TravellingExpensesReimbursementCreate,
    TravellingExpensesReimbursementUpdate,
)
from app.repositories.travelling_expenses_reimbursement_repository import (
    create_reimbursement,
    delete_reimbursement,
    get_all_reimbursements,
    get_reimbursement,
    update_reimbursement,
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


def list_reimbursements_service(db: Session):
    return get_all_reimbursements(db)


def update_reimbursement_service(
    db: Session,
    reimbursement_id: int,
    data: TravellingExpensesReimbursementUpdate,
):
    return update_reimbursement(
        db,
        reimbursement_id,
        data.model_dump(exclude_unset=True),
    )


def delete_reimbursement_service(db: Session, reimbursement_id: int) -> bool:
    return delete_reimbursement(db, reimbursement_id)