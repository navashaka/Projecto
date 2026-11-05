from collections.abc import Callable
from typing import TypeVar

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.modules.bank.models import (
    BankBook,
    BankPassbook,
    BankPayment,
    BankPaymentItem,
    BankReceipt,
    BankReceiptItem,
    BankReconciliation,
)
from app.modules.bank.schemas import (
    BankBookCreate,
    BankBookRead,
    BankBookUpdate,
    BankPassbookCreate,
    BankPassbookRead,
    BankPassbookUpdate,
    BankPaymentCreate,
    BankPaymentItemCreate,
    BankPaymentItemRead,
    BankPaymentItemUpdate,
    BankPaymentRead,
    BankPaymentUpdate,
    BankReceiptCreate,
    BankReceiptItemCreate,
    BankReceiptItemRead,
    BankReceiptItemUpdate,
    BankReceiptRead,
    BankReceiptUpdate,
    BankReconciliationCreate,
    BankReconciliationRead,
    BankReconciliationUpdate,
)
from app.modules.bank.service import BankService

Record = TypeVar("Record")
router = APIRouter(prefix="/bank", tags=["bank"])


def _database_call(operation: Callable[[], Record]) -> Record:
    try:
        return operation()
    except IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bank record violates a database constraint",
        ) from error
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bank database operation failed",
        ) from error


def _register_crud_routes(
    path: str,
    resource_name: str,
    model: type,
    create_schema: type[BaseModel],
    update_schema: type[BaseModel],
    read_schema: type[BaseModel],
) -> None:
    def list_records(db: Session = Depends(get_db)):
        return _database_call(lambda: BankService.get_all(db, model))

    def get_record(record_id: int, db: Session = Depends(get_db)):
        record = _database_call(lambda: BankService.get_by_id(db, model, record_id))
        if record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource_name} not found")
        return record

    def create_record(payload: create_schema, db: Session = Depends(get_db)):
        return _database_call(lambda: BankService.create(db, model, payload))

    def update_record(record_id: int, payload: update_schema, db: Session = Depends(get_db)):
        record = _database_call(lambda: BankService.get_by_id(db, model, record_id))
        if record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource_name} not found")
        return _database_call(lambda: BankService.update(db, record, payload))

    def delete_record(record_id: int, db: Session = Depends(get_db)) -> Response:
        record = _database_call(lambda: BankService.get_by_id(db, model, record_id))
        if record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource_name} not found")
        _database_call(lambda: BankService.delete(db, record))
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    endpoints = (
        ("list", list_records),
        ("get", get_record),
        ("create", create_record),
        ("update", update_record),
        ("delete", delete_record),
    )
    for action, endpoint in endpoints:
        endpoint.__name__ = f"{action}_{resource_name.replace('-', '_')}"

    router.add_api_route(path, list_records, methods=["GET"], response_model=list[read_schema])
    router.add_api_route(f"{path}/{{record_id}}", get_record, methods=["GET"], response_model=read_schema)
    router.add_api_route(
        path,
        create_record,
        methods=["POST"],
        response_model=read_schema,
        status_code=status.HTTP_201_CREATED,
    )
    router.add_api_route(
        f"{path}/{{record_id}}",
        update_record,
        methods=["PUT"],
        response_model=read_schema,
    )
    router.add_api_route(
        f"{path}/{{record_id}}",
        delete_record,
        methods=["DELETE"],
        status_code=status.HTTP_204_NO_CONTENT,
        response_class=Response,
        response_model=None,
    )


_register_crud_routes(
    "/passbooks", "bank-passbook", BankPassbook,
    BankPassbookCreate, BankPassbookUpdate, BankPassbookRead,
)
_register_crud_routes(
    "/books", "bank-book", BankBook,
    BankBookCreate, BankBookUpdate, BankBookRead,
)
_register_crud_routes(
    "/receipts", "bank-receipt", BankReceipt,
    BankReceiptCreate, BankReceiptUpdate, BankReceiptRead,
)
_register_crud_routes(
    "/receipt-items", "bank-receipt-item", BankReceiptItem,
    BankReceiptItemCreate, BankReceiptItemUpdate, BankReceiptItemRead,
)
_register_crud_routes(
    "/payments", "bank-payment", BankPayment,
    BankPaymentCreate, BankPaymentUpdate, BankPaymentRead,
)
_register_crud_routes(
    "/payment-items", "bank-payment-item", BankPaymentItem,
    BankPaymentItemCreate, BankPaymentItemUpdate, BankPaymentItemRead,
)
_register_crud_routes(
    "/reconciliations", "bank-reconciliation", BankReconciliation,
    BankReconciliationCreate, BankReconciliationUpdate, BankReconciliationRead,
)