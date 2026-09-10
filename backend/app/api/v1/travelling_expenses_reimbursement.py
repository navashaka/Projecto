from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.travelling_expenses_reimbursement import (
    TravellingExpensesReimbursementCreate,
)
from app.services.travelling_expenses_reimbursement_service import (
    create_reimbursement_service,
    get_reimbursement_service,
)


router = APIRouter(
    prefix="/travelling-expenses-reimbursement",
    tags=["Travelling Expenses Reimbursement"],
)


@router.post("/")
def create_reimbursement(
    data: TravellingExpensesReimbursementCreate,
    db: Session = Depends(get_db),
):
    return create_reimbursement_service(db, data)


@router.get("/{reimbursement_id}")
def get_reimbursement(
    reimbursement_id: int,
    db: Session = Depends(get_db),
):
    return get_reimbursement_service(db, reimbursement_id)