from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.travelling_expenses_reimbursement import (
    TravellingExpensesReimbursementCreate,
    TravellingExpensesReimbursementUpdate,
)
from app.services.travelling_expenses_reimbursement_service import (
    create_reimbursement_service,
    delete_reimbursement_service,
    get_reimbursement_service,
    list_reimbursements_service,
    update_reimbursement_service,
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


@router.get("/")
def list_reimbursements(db: Session = Depends(get_db)):
    return list_reimbursements_service(db)


@router.get("/{reimbursement_id}")
def get_reimbursement(
    reimbursement_id: int,
    db: Session = Depends(get_db),
):
    reimbursement = get_reimbursement_service(db, reimbursement_id)
    if not reimbursement:
        raise HTTPException(
            status_code=404,
            detail="Travelling expenses reimbursement not found",
        )
    return reimbursement


@router.put("/{reimbursement_id}")
def update_reimbursement(
    reimbursement_id: int,
    data: TravellingExpensesReimbursementUpdate,
    db: Session = Depends(get_db),
):
    reimbursement = update_reimbursement_service(db, reimbursement_id, data)
    if not reimbursement:
        raise HTTPException(
            status_code=404,
            detail="Travelling expenses reimbursement not found",
        )
    return reimbursement


@router.delete("/{reimbursement_id}")
def delete_reimbursement(reimbursement_id: int, db: Session = Depends(get_db)):
    if not delete_reimbursement_service(db, reimbursement_id):
        raise HTTPException(
            status_code=404,
            detail="Travelling expenses reimbursement not found",
        )
    return {"detail": "Travelling expenses reimbursement deleted"}