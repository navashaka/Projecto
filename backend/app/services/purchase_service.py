"""Purchase form validation, mapping, and persistence."""

from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.purchase_invoice import (
    PurchaseAdvanceRequisition,
    PurchaseOrder,
    PurchaseQuotationComparison,
    PurchaseVendor,
)
from app.repositories.purchase_repository import PURCHASE_MODELS, PurchaseRepository

FIELDS: dict[str, set[str]] = {
    "vendors": {
        "vendorName", "email", "phone", "streetNumber", "streetName", "city",
        "state", "country", "zipcode", "pan", "gstin", "bankDetails",
        "bankName", "accountNumber", "ifscCode", "msmeDetails", "msmeStatus",
        "msmeNumber", "activity",
    },
    "advance-requisitions": {
        "vendorname", "streetNumber", "streetName", "city", "state", "country",
        "zipcode", "bankDetails", "bankName", "accountNumber", "ifscCode",
        "purchaseOrderNumber", "purchaseOrderDate",
        "PurchaseOrderValueBeforeGST", "purchaseOrderValueAfterGST",
        "advanceRequestedAmount", "createdBy", "checkedBy", "approvedBy",
    },
    "quotation-comparisons": {
        "vendorname", "streetNumber", "streetName", "city", "state", "country",
        "zipcode", "quotationNumber", "quotationDate", "item", "description",
        "quantity", "uom", "rate", "amount", "totalAmount", "deliveryterms",
        "paymentterms", "additionalTerms&Conditions",
    },
    "orders": {
        "orderNumber", "orderDate", "indentNumber", "indentDate",
        "quotationNumber", "quotationDate", "vendorname", "streetNumber",
        "streetName", "city", "state", "country", "zipcode", "bankDetails",
        "bankName", "accountNumber", "ifscCode", "item", "description",
        "quantity", "uom", "rate", "amount", "totalAmount", "Deliveryterms",
        "Paymentterms", "defaultTerms&Conditions",
        "additionalTerms&Conditions", "createdBy", "checkedBy", "approvedBy",
    },
}

DATE_FIELDS: dict[str, set[str]] = {
    "advance-requisitions": {"purchaseOrderDate"},
    "quotation-comparisons": {"quotationDate"},
    "orders": {"orderDate", "indentDate", "quotationDate"},
}

NUMBER_FIELDS: dict[str, set[str]] = {
    "advance-requisitions": {
        "PurchaseOrderValueBeforeGST", "purchaseOrderValueAfterGST",
        "advanceRequestedAmount",
    },
    "quotation-comparisons": {"quantity", "rate", "amount", "totalAmount"},
    "orders": {"quantity", "rate", "amount", "totalAmount"},
}

MAX_LENGTHS: dict[str, dict[str, int]] = {
    "vendors": {
        "vendorName": 255, "email": 255, "phone": 20, "streetNumber": 100,
        "streetName": 255, "city": 100, "state": 100, "country": 100,
        "zipcode": 20, "pan": 20, "gstin": 20, "bankName": 150,
        "accountNumber": 50, "ifscCode": 20, "msmeStatus": 50,
        "msmeNumber": 50, "activity": 100,
    },
    "advance-requisitions": {
        "vendorname": 255, "purchaseOrderNumber": 100,
        "createdBy": 100, "checkedBy": 100, "approvedBy": 100,
    },
    "quotation-comparisons": {"vendorname": 255, "quotationNumber": 50},
    "orders": {
        "orderNumber": 50, "indentNumber": 100, "quotationNumber": 100,
        "vendorname": 255, "createdBy": 100, "checkedBy": 100, "approvedBy": 100,
    },
}


class PurchaseValidationError(ValueError):
    pass


class PurchaseConflictError(ValueError):
    pass


def _validate_payload(form_type: str, payload: dict[str, Any]) -> dict[str, str]:
    expected = FIELDS[form_type]
    missing = expected - payload.keys()
    extra = payload.keys() - expected
    if missing:
        raise PurchaseValidationError(
            f"Missing required Purchase fields: {', '.join(sorted(missing))}"
        )
    if extra:
        raise PurchaseValidationError(
            f"Unexpected Purchase fields: {', '.join(sorted(extra))}"
        )

    values: dict[str, str] = {}
    for key in expected:
        value = payload[key]
        if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
            raise PurchaseValidationError(f"{key} must be a string or number")
        text_value = str(value).strip()
        if not text_value:
            raise PurchaseValidationError(f"{key} is required")
        max_length = MAX_LENGTHS.get(form_type, {}).get(key)
        if max_length is not None and len(text_value) > max_length:
            raise PurchaseValidationError(
                f"{key} must be no longer than {max_length} characters"
            )
        if key in DATE_FIELDS.get(form_type, set()):
            try:
                date.fromisoformat(text_value)
            except ValueError as error:
                raise PurchaseValidationError(f"{key} must be a valid ISO date") from error
        if key in NUMBER_FIELDS.get(form_type, set()):
            try:
                number = Decimal(text_value)
            except (InvalidOperation, ValueError) as error:
                raise PurchaseValidationError(f"{key} must be a finite number") from error
            if not number.is_finite():
                raise PurchaseValidationError(f"{key} must be a finite number")
            if abs(number) >= Decimal("10000000000000"):
                raise PurchaseValidationError(f"{key} exceeds the supported numeric range")
            try:
                has_extra_precision = number.quantize(Decimal("0.01")) != number
            except InvalidOperation as error:
                raise PurchaseValidationError(
                    f"{key} exceeds the supported numeric precision"
                ) from error
            if has_extra_precision:
                raise PurchaseValidationError(
                    f"{key} supports no more than two decimal places"
                )
        values[key] = text_value

    if form_type == "vendors":
        if values["msmeStatus"] not in {"Registered", "Unregistered"}:
            raise PurchaseValidationError("msmeStatus is invalid")
        if values["activity"] not in {"Manufacturing", "Service", "Trading"}:
            raise PurchaseValidationError("activity is invalid")
        email = values["email"]
        if email.count("@") != 1 or "." not in email.rsplit("@", 1)[-1]:
            raise PurchaseValidationError("email must be a valid email address")
    return values


def _as_date(value: str) -> date:
    return date.fromisoformat(value)


def _as_decimal(value: str) -> Decimal:
    return Decimal(value)


def _as_json_number(value: str) -> float:
    return float(_as_decimal(value))


def _lookup_vendor_id(db: Session, vendor_name: str) -> int | None:
    matches = (
        db.query(PurchaseVendor)
        .filter(func.lower(PurchaseVendor.vendor_name) == vendor_name.strip().lower())
        .limit(2)
        .all()
    )
    return matches[0].id if len(matches) == 1 else None


def _json_value(value: Any, *keys: str) -> str:
    if not isinstance(value, dict):
        return ""
    for key in keys:
        if key in value and value[key] is not None:
            return str(value[key])
    return ""


def _merge_json(existing: Any, updates: dict[str, Any]) -> dict[str, Any]:
    retained = existing.copy() if isinstance(existing, dict) else {}
    retained.update(updates)
    return retained


def _address_payload(values: dict[str, str], existing: Any = None) -> dict[str, Any]:
    return _merge_json(
        existing,
        {
            "streetNumber": values["streetNumber"],
            "streetName": values["streetName"],
            "city": values["city"],
            "state": values["state"],
            "country": values["country"],
            "zipcode": values["zipcode"],
        },
    )


def _bank_payload(values: dict[str, str], existing: Any = None) -> dict[str, Any]:
    return _merge_json(
        existing,
        {
            "bankDetails": values["bankDetails"],
            "bankName": values["bankName"],
            "accountNumber": values["accountNumber"],
            "ifscCode": values["ifscCode"],
        },
    )


def _merge_collection(existing: Any, updates: dict[str, Any]) -> list[dict[str, Any]]:
    items = existing[:] if isinstance(existing, list) else []
    if items and isinstance(items[0], dict):
        items[0] = _merge_json(items[0], updates)
    else:
        items.insert(0, updates)
    return items


class PurchaseService:
    @staticmethod
    def model_for(form_type: str) -> type:
        model = PURCHASE_MODELS.get(form_type)
        if model is None:
            raise KeyError(form_type)
        return model

    @staticmethod
    def list_records(db: Session, form_type: str) -> list:
        return PurchaseRepository.get_all(db, PurchaseService.model_for(form_type))

    @staticmethod
    def get_record(db: Session, form_type: str, record_id: int):
        return PurchaseRepository.get_by_id(
            db, PurchaseService.model_for(form_type), record_id
        )

    @staticmethod
    def create(db: Session, form_type: str, payload: dict[str, Any]):
        values = _validate_payload(form_type, payload)

        if form_type == "vendors":
            record = PurchaseVendor(
                vendor_name=values["vendorName"],
                email_id=values["email"],
                contact_no=values["phone"],
                street_no=values["streetNumber"],
                street_name=values["streetName"],
                city=values["city"],
                state=values["state"],
                country=values["country"],
                pin=values["zipcode"],
                pan=values["pan"],
                gstn=values["gstin"],
                bank_details=values["bankDetails"],
                bank_name=values["bankName"],
                account_no=values["accountNumber"],
                ifsc=values["ifscCode"],
                msme_details=values["msmeDetails"],
                msme_status=values["msmeStatus"],
                msme_no=values["msmeNumber"],
                activity=values["activity"],
            )
        elif form_type == "advance-requisitions":
            record = PurchaseAdvanceRequisition(
                vendor_id=_lookup_vendor_id(db, values["vendorname"]),
                vendor_name=values["vendorname"],
                vendor_address=_address_payload(values),
                vendor_bank_details=_bank_payload(values),
                purchase_order_no=values["purchaseOrderNumber"],
                purchase_order_date=_as_date(values["purchaseOrderDate"]),
                purchase_order_value_before_gst=_as_decimal(
                    values["PurchaseOrderValueBeforeGST"]
                ),
                purchase_order_value_with_gst=_as_decimal(
                    values["purchaseOrderValueAfterGST"]
                ),
                advance_requested_amount=_as_decimal(values["advanceRequestedAmount"]),
                created_by=values["createdBy"],
                checked_by=values["checkedBy"],
                approved_by=values["approvedBy"],
            )
        elif form_type == "quotation-comparisons":
            record = PurchaseQuotationComparison(
                comparison_no=values["quotationNumber"],
                comparison_date=_as_date(values["quotationDate"]),
                vendors=[{
                    "vendorName": values["vendorname"],
                    "address": _address_payload(values),
                }],
                items=[{
                    "item": values["item"],
                    "description": values["description"],
                    "quantity": _as_json_number(values["quantity"]),
                    "uom": values["uom"],
                    "rate": _as_json_number(values["rate"]),
                    "amount": _as_json_number(values["amount"]),
                }],
                total_amount=_as_decimal(values["amount"]),
                grand_total=_as_decimal(values["totalAmount"]),
                delivery_terms=values["deliveryterms"],
                payment_terms=values["paymentterms"],
                additional_terms_conditions=values["additionalTerms&Conditions"],
            )
        else:
            record = PurchaseOrder(
                purchase_order_no=values["orderNumber"],
                purchase_order_date=_as_date(values["orderDate"]),
                indent_no=values["indentNumber"],
                indent_date=_as_date(values["indentDate"]),
                quotation_no=values["quotationNumber"],
                quotation_date=_as_date(values["quotationDate"]),
                vendor_id=_lookup_vendor_id(db, values["vendorname"]),
                vendor_name=values["vendorname"],
                vendor_address=_address_payload(values),
                vendor_bank_details=_bank_payload(values),
                items=[{
                    "item": values["item"],
                    "description": values["description"],
                    "quantity": _as_json_number(values["quantity"]),
                    "uom": values["uom"],
                    "rate": _as_json_number(values["rate"]),
                    "amount": _as_json_number(values["amount"]),
                }],
                total_amount=_as_decimal(values["amount"]),
                grand_total=_as_decimal(values["totalAmount"]),
                delivery_terms=values["Deliveryterms"],
                payment_terms=values["Paymentterms"],
                default_terms_conditions=values["defaultTerms&Conditions"],
                additional_terms_conditions=values["additionalTerms&Conditions"],
                created_by=values["createdBy"],
                checked_by=values["checkedBy"],
                approved_by=values["approvedBy"],
            )

        return PurchaseRepository.create(db, record)

    @staticmethod
    def update(db: Session, form_type: str, record, payload: dict[str, Any]):
        values = _validate_payload(form_type, payload)

        if form_type == "vendors":
            field_map = {
                "vendor_name": "vendorName",
                "email_id": "email",
                "contact_no": "phone",
                "street_no": "streetNumber",
                "street_name": "streetName",
                "city": "city",
                "state": "state",
                "country": "country",
                "pin": "zipcode",
                "pan": "pan",
                "gstn": "gstin",
                "bank_details": "bankDetails",
                "bank_name": "bankName",
                "account_no": "accountNumber",
                "ifsc": "ifscCode",
                "msme_details": "msmeDetails",
                "msme_status": "msmeStatus",
                "msme_no": "msmeNumber",
                "activity": "activity",
            }
            for column, key in field_map.items():
                setattr(record, column, values[key])
        elif form_type == "advance-requisitions":
            vendor_id = _lookup_vendor_id(db, values["vendorname"])
            if vendor_id is not None:
                record.vendor_id = vendor_id
            record.vendor_name = values["vendorname"]
            record.vendor_address = _address_payload(values, record.vendor_address)
            record.vendor_bank_details = _bank_payload(values, record.vendor_bank_details)
            record.purchase_order_no = values["purchaseOrderNumber"]
            record.purchase_order_date = _as_date(values["purchaseOrderDate"])
            record.purchase_order_value_before_gst = _as_decimal(
                values["PurchaseOrderValueBeforeGST"]
            )
            record.purchase_order_value_with_gst = _as_decimal(
                values["purchaseOrderValueAfterGST"]
            )
            record.advance_requested_amount = _as_decimal(values["advanceRequestedAmount"])
            record.created_by = values["createdBy"]
            record.checked_by = values["checkedBy"]
            record.approved_by = values["approvedBy"]
        elif form_type == "quotation-comparisons":
            record.comparison_no = values["quotationNumber"]
            record.comparison_date = _as_date(values["quotationDate"])
            existing_vendors = (
                record.vendors if isinstance(record.vendors, list) else []
            )
            first_vendor = (
                existing_vendors[0]
                if existing_vendors and isinstance(existing_vendors[0], dict)
                else {}
            )
            existing_address = first_vendor.get("address")
            record.vendors = _merge_collection(
                record.vendors,
                {
                    "vendorName": values["vendorname"],
                    "address": _address_payload(values, existing_address),
                },
            )
            record.items = _merge_collection(
                record.items,
                {
                    "item": values["item"],
                    "description": values["description"],
                    "quantity": _as_json_number(values["quantity"]),
                    "uom": values["uom"],
                    "rate": _as_json_number(values["rate"]),
                    "amount": _as_json_number(values["amount"]),
                },
            )
            record.total_amount = _as_decimal(values["amount"])
            record.grand_total = _as_decimal(values["totalAmount"])
            record.delivery_terms = values["deliveryterms"]
            record.payment_terms = values["paymentterms"]
            record.additional_terms_conditions = values["additionalTerms&Conditions"]
        else:
            vendor_id = _lookup_vendor_id(db, values["vendorname"])
            if vendor_id is not None:
                record.vendor_id = vendor_id
            record.purchase_order_no = values["orderNumber"]
            record.purchase_order_date = _as_date(values["orderDate"])
            record.indent_no = values["indentNumber"]
            record.indent_date = _as_date(values["indentDate"])
            record.quotation_no = values["quotationNumber"]
            record.quotation_date = _as_date(values["quotationDate"])
            record.vendor_name = values["vendorname"]
            record.vendor_address = _address_payload(values, record.vendor_address)
            record.vendor_bank_details = _bank_payload(values, record.vendor_bank_details)
            record.items = _merge_collection(
                record.items,
                {
                    "item": values["item"],
                    "description": values["description"],
                    "quantity": _as_json_number(values["quantity"]),
                    "uom": values["uom"],
                    "rate": _as_json_number(values["rate"]),
                    "amount": _as_json_number(values["amount"]),
                },
            )
            record.total_amount = _as_decimal(values["amount"])
            record.grand_total = _as_decimal(values["totalAmount"])
            record.delivery_terms = values["Deliveryterms"]
            record.payment_terms = values["Paymentterms"]
            record.default_terms_conditions = values["defaultTerms&Conditions"]
            record.additional_terms_conditions = values["additionalTerms&Conditions"]
            record.created_by = values["createdBy"]
            record.checked_by = values["checkedBy"]
            record.approved_by = values["approvedBy"]

        record.updated_at = func.now()
        return PurchaseRepository.update(db, record)

    @staticmethod
    def delete(db: Session, form_type: str, record) -> None:
        if form_type == "vendors":
            references = (
                db.query(PurchaseAdvanceRequisition.id)
                .filter(
                    or_(
                        PurchaseAdvanceRequisition.vendor_id == record.id,
                        func.lower(PurchaseAdvanceRequisition.vendor_name)
                        == record.vendor_name.lower(),
                    )
                )
                .union(
                    db.query(PurchaseOrder.id).filter(
                        or_(
                            PurchaseOrder.vendor_id == record.id,
                            func.lower(PurchaseOrder.vendor_name)
                            == record.vendor_name.lower(),
                        )
                    )
                )
                .first()
            )
            if references is not None:
                raise PurchaseConflictError(
                    "Vendor is referenced by a Purchase record and cannot be deleted"
                )
        PurchaseRepository.delete(db, record)

    @staticmethod
    def to_read(form_type: str, record) -> dict[str, Any]:
        if form_type == "vendors":
            payload = {
                "vendorName": record.vendor_name,
                "email": record.email_id,
                "phone": record.contact_no,
                "streetNumber": record.street_no,
                "streetName": record.street_name,
                "city": record.city,
                "state": record.state,
                "country": record.country,
                "zipcode": record.pin,
                "pan": record.pan,
                "gstin": record.gstn,
                "bankDetails": record.bank_details,
                "bankName": record.bank_name,
                "accountNumber": record.account_no,
                "ifscCode": record.ifsc,
                "msmeDetails": record.msme_details,
                "msmeStatus": record.msme_status,
                "msmeNumber": record.msme_no,
                "activity": record.activity,
            }
        elif form_type == "advance-requisitions":
            payload = {
                "vendorname": record.vendor_name,
                "streetNumber": _json_value(record.vendor_address, "streetNumber", "street_no"),
                "streetName": _json_value(record.vendor_address, "streetName", "street_name"),
                "city": _json_value(record.vendor_address, "city"),
                "state": _json_value(record.vendor_address, "state"),
                "country": _json_value(record.vendor_address, "country"),
                "zipcode": _json_value(record.vendor_address, "zipcode", "pin"),
                "bankDetails": _json_value(record.vendor_bank_details, "bankDetails"),
                "bankName": _json_value(record.vendor_bank_details, "bankName", "bank_name"),
                "accountNumber": _json_value(record.vendor_bank_details, "accountNumber", "account_no"),
                "ifscCode": _json_value(record.vendor_bank_details, "ifscCode", "ifsc"),
                "purchaseOrderNumber": record.purchase_order_no,
                "purchaseOrderDate": str(record.purchase_order_date or ""),
                "PurchaseOrderValueBeforeGST": str(record.purchase_order_value_before_gst or ""),
                "purchaseOrderValueAfterGST": str(record.purchase_order_value_with_gst or ""),
                "advanceRequestedAmount": str(record.advance_requested_amount or ""),
                "createdBy": record.created_by,
                "checkedBy": record.checked_by,
                "approvedBy": record.approved_by,
            }
        elif form_type == "quotation-comparisons":
            vendor = record.vendors[0] if isinstance(record.vendors, list) and record.vendors else {}
            address = vendor.get("address", {}) if isinstance(vendor, dict) else {}
            item = record.items[0] if isinstance(record.items, list) and record.items else {}
            payload = {
                "vendorname": _json_value(vendor, "vendorName", "vendor_name"),
                "streetNumber": _json_value(address, "streetNumber", "street_no"),
                "streetName": _json_value(address, "streetName", "street_name"),
                "city": _json_value(address, "city"),
                "state": _json_value(address, "state"),
                "country": _json_value(address, "country"),
                "zipcode": _json_value(address, "zipcode", "pin"),
                "quotationNumber": record.comparison_no,
                "quotationDate": str(record.comparison_date or ""),
                "item": _json_value(item, "item", "item_name"),
                "description": _json_value(item, "description"),
                "quantity": _json_value(item, "quantity"),
                "uom": _json_value(item, "uom"),
                "rate": _json_value(item, "rate"),
                "amount": _json_value(item, "amount"),
                "totalAmount": str(record.grand_total or ""),
                "deliveryterms": record.delivery_terms,
                "paymentterms": record.payment_terms,
                "additionalTerms&Conditions": record.additional_terms_conditions,
            }
        else:
            address = record.vendor_address
            bank = record.vendor_bank_details
            item = record.items[0] if isinstance(record.items, list) and record.items else {}
            payload = {
                "orderNumber": record.purchase_order_no,
                "orderDate": str(record.purchase_order_date or ""),
                "indentNumber": record.indent_no,
                "indentDate": str(record.indent_date or ""),
                "quotationNumber": record.quotation_no,
                "quotationDate": str(record.quotation_date or ""),
                "vendorname": record.vendor_name,
                "streetNumber": _json_value(address, "streetNumber", "street_no"),
                "streetName": _json_value(address, "streetName", "street_name"),
                "city": _json_value(address, "city"),
                "state": _json_value(address, "state"),
                "country": _json_value(address, "country"),
                "zipcode": _json_value(address, "zipcode", "pin"),
                "bankDetails": _json_value(bank, "bankDetails"),
                "bankName": _json_value(bank, "bankName", "bank_name"),
                "accountNumber": _json_value(bank, "accountNumber", "account_no"),
                "ifscCode": _json_value(bank, "ifscCode", "ifsc"),
                "item": _json_value(item, "item", "item_name"),
                "description": _json_value(item, "description"),
                "quantity": _json_value(item, "quantity"),
                "uom": _json_value(item, "uom"),
                "rate": _json_value(item, "rate"),
                "amount": _json_value(item, "amount"),
                "totalAmount": str(record.grand_total or ""),
                "Deliveryterms": record.delivery_terms,
                "Paymentterms": record.payment_terms,
                "defaultTerms&Conditions": record.default_terms_conditions,
                "additionalTerms&Conditions": record.additional_terms_conditions,
                "createdBy": record.created_by,
                "checkedBy": record.checked_by,
                "approvedBy": record.approved_by,
            }
        return {
            "id": record.id,
            "form_type": form_type,
            "payload": {key: "" if value is None else str(value) for key, value in payload.items()},
        }
