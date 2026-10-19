from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import DeclarativeBase, Session

from . import repository
from .models import (
    ARCustomer,
    ARInvoice,
    ARProformaInvoice,
    ARQuotation,
)


def _money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _prepare_invoice_data(data: dict[str, Any]) -> dict[str, Any]:
    values = dict(data)
    items = values.get("items")

    if items is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invoice items are required.",
        )

    if not items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one invoice item is required.",
        )

    subtotal = Decimal("0.00")
    total_tax = Decimal("0.00")
    prepared_items = []

    for index, item in enumerate(items, start=1):
        row = dict(item)

        try:
            quantity = Decimal(str(row.get("quantity", 0)))
            rate = Decimal(str(row.get("rate", 0)))
            gst_rate = Decimal(str(row.get("gst_rate", 0)))
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid numeric value in invoice item {index}.",
            ) from exc

        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Quantity must be greater than zero in item {index}.",
            )

        if rate < 0 or gst_rate < 0 or gst_rate > 100:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid rate or GST percentage in item {index}.",
            )

        value = _money(quantity * rate)
        tax = _money(value * gst_rate / Decimal("100"))
        total_amount = _money(value + tax)

        row["sl_no"] = row.get("sl_no") or index
        row["quantity"] = quantity
        row["rate"] = rate
        row["gst_rate"] = gst_rate
        row["value"] = value
        row["tax"] = tax
        row["total_amount"] = total_amount

        subtotal += value
        total_tax += tax
        prepared_items.append(row)

    values["items"] = prepared_items
    values["total"] = _money(subtotal)
    values["gst"] = _money(total_tax)
    values["grand_total"] = _money(subtotal + total_tax)

    return values


def _validate_invoice_references(
    db: Session,
    data: dict[str, Any],
) -> None:
    buyer_customer_id = data.get("buyer_customer_id")
    quotation_id = data.get("quotation_id")
    proforma_invoice_id = data.get("proforma_invoice_id")

    if buyer_customer_id is not None:
        if db.get(ARCustomer, buyer_customer_id) is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Buyer customer does not exist.",
            )

    if quotation_id is not None:
        if db.get(ARQuotation, quotation_id) is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Quotation does not exist.",
            )

    if proforma_invoice_id is not None:
        if db.get(ARProformaInvoice, proforma_invoice_id) is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Proforma invoice does not exist.",
            )


def get_all_records(
    db: Session,
    model: type[DeclarativeBase],
) -> list[DeclarativeBase]:
    return repository.get_all(db, model)


def get_record_by_id(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
) -> DeclarativeBase:
    record = repository.get_by_id(db, model, record_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AR record not found.",
        )

    return record


def create_record(
    db: Session,
    model: type[DeclarativeBase],
    data: dict[str, Any],
) -> DeclarativeBase:
    values = dict(data)

    if model is ARInvoice:
        values = _prepare_invoice_data(values)
        _validate_invoice_references(db, values)

    return repository.create(db, model, values)


def update_record(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
    data: dict[str, Any],
) -> DeclarativeBase:
    record = get_record_by_id(db, model, record_id)
    values = dict(data)

    if model is ARInvoice and "items" in values:
        values = _prepare_invoice_data(values)
        _validate_invoice_references(db, values)

    return repository.update(db, record, values)


def delete_record(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
) -> None:
    record = get_record_by_id(db, model, record_id)
    repository.delete(db, record)