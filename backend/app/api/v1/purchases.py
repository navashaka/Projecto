"""Purchase endpoints."""

from collections.abc import Callable
from typing import TypeVar

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.purchase import PurchaseFormRead, PurchaseFormWrite
from app.services.purchase_service import (
    PurchaseConflictError,
    PurchaseService,
    PurchaseValidationError,
)

Result = TypeVar("Result")
router = APIRouter(prefix="/purchases", tags=["purchases"])


def _database_call(operation: Callable[[], Result]) -> Result:
    try:
        return operation()
    except IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Purchase record violates a database constraint",
        ) from error
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Purchase database operation failed",
        ) from error


def _form_type(resource: str) -> str:
    try:
        PurchaseService.model_for(resource)
    except KeyError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase form not found") from error
    return resource


def _record_or_404(db: Session, form_type: str, record_id: int):
    record = _database_call(lambda: PurchaseService.get_record(db, form_type, record_id))
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase record not found")
    return record


@router.get("/{resource}", response_model=list[PurchaseFormRead])
def list_purchase_records(resource: str, db: Session = Depends(get_db)):
    form_type = _form_type(resource)
    records = _database_call(lambda: PurchaseService.list_records(db, form_type))
    return [PurchaseService.to_read(form_type, record) for record in records]


@router.get("/{resource}/{record_id}", response_model=PurchaseFormRead)
def get_purchase_record(resource: str, record_id: int, db: Session = Depends(get_db)):
    form_type = _form_type(resource)
    return PurchaseService.to_read(
        form_type, _record_or_404(db, form_type, record_id)
    )


@router.post(
    "/{resource}",
    response_model=PurchaseFormRead,
    status_code=status.HTTP_201_CREATED,
)
def create_purchase_record(
    resource: str,
    request: PurchaseFormWrite,
    db: Session = Depends(get_db),
):
    form_type = _form_type(resource)
    try:
        record = _database_call(
            lambda: PurchaseService.create(db, form_type, request.payload)
        )
    except PurchaseValidationError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    return PurchaseService.to_read(form_type, record)


@router.put("/{resource}/{record_id}", response_model=PurchaseFormRead)
def update_purchase_record(
    resource: str,
    record_id: int,
    request: PurchaseFormWrite,
    db: Session = Depends(get_db),
):
    form_type = _form_type(resource)
    record = _record_or_404(db, form_type, record_id)
    try:
        updated = _database_call(
            lambda: PurchaseService.update(db, form_type, record, request.payload)
        )
    except PurchaseValidationError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    return PurchaseService.to_read(form_type, updated)


@router.delete("/{resource}/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_purchase_record(
    resource: str,
    record_id: int,
    db: Session = Depends(get_db),
) -> Response:
    form_type = _form_type(resource)
    record = _record_or_404(db, form_type, record_id)
    try:
        _database_call(lambda: PurchaseService.delete(db, form_type, record))
    except PurchaseConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
