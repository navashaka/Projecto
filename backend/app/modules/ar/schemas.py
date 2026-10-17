from typing import Any
import re

from pydantic import BaseModel, ConfigDict, Field, create_model, field_validator
from sqlalchemy import Column, Numeric, String
from sqlalchemy.orm import DeclarativeBase

from .models import (
    ARCustomer,
    ARCustomerBankAccount,
    ARInvoice,
    ARInvoiceItem,
    ARProformaInvoice,
    ARProformaInvoiceItem,
    ARQuotation,
    ARQuotationItem,
    ARTaxInvoice,
    ARTaxInvoiceItem,
)


AR_MODELS: tuple[type[DeclarativeBase], ...] = (
    ARCustomer,
    ARCustomerBankAccount,
    ARQuotation,
    ARQuotationItem,
    ARProformaInvoice,
    ARProformaInvoiceItem,
    ARInvoice,
    ARInvoiceItem,
    ARTaxInvoice,
    ARTaxInvoiceItem,
)

AR_RESOURCES = {
    ARCustomer: "customers",
    ARCustomerBankAccount: "customer-bank-accounts",
    ARQuotation: "quotations",
    ARQuotationItem: "quotation-items",
    ARProformaInvoice: "proforma-invoices",
    ARProformaInvoiceItem: "proforma-invoice-items",
    ARInvoice: "invoices",
    ARInvoiceItem: "invoice-items",
    ARTaxInvoice: "tax-invoices",
    ARTaxInvoiceItem: "tax-invoice-items",
}

AR_CHILDREN = {
    ARCustomer: ("bank_accounts", ARCustomerBankAccount, "customer_id"),
    ARQuotation: ("items", ARQuotationItem, "quotation_id"),
    ARProformaInvoice: (
        "items",
        ARProformaInvoiceItem,
        "proforma_invoice_id",
    ),
    ARInvoice: ("items", ARInvoiceItem, "invoice_id"),
    ARTaxInvoice: ("items", ARTaxInvoiceItem, "tax_invoice_id"),
}

_PAN_PATTERN = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
_PHONE_PATTERN = re.compile(r"^[0-9]{10}$")
_ACCOUNT_NUMBER_PATTERN = re.compile(r"^[0-9]{1,50}$")
_IFSC_PATTERN = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")


def _normalized_field_value(
    field_name: str,
    value: Any,
    *,
    required: bool,
) -> Any:
    if value is None:
        return value
    if not isinstance(value, (str, int)) or isinstance(value, bool):
        raise ValueError(f"{field_name} must be text.")

    text_value = str(value).strip()
    if not text_value and not required:
        return text_value

    normalized_name = field_name.lower()
    if normalized_name == "pan" or normalized_name.endswith("_pan"):
        text_value = text_value.upper()
        if not _PAN_PATTERN.fullmatch(text_value):
            raise ValueError(
                f"{field_name} must be 10 characters in PAN format (ABCDE1234F)."
            )
    elif normalized_name == "contact_no":
        if not _PHONE_PATTERN.fullmatch(text_value):
            raise ValueError(f"{field_name} must contain exactly 10 digits.")
    elif (
        normalized_name in {"account_no", "bank_account_no"}
        or re.fullmatch(r"bank_account_no_[0-9]+", normalized_name)
    ):
        if not _ACCOUNT_NUMBER_PATTERN.fullmatch(text_value):
            raise ValueError(f"{field_name} must contain 1 to 50 digits only.")
    elif normalized_name == "ifsc" or normalized_name.endswith("_ifsc"):
        text_value = text_value.upper()
        if not _IFSC_PATTERN.fullmatch(text_value):
            raise ValueError(
                f"{field_name} must be a valid 11-character IFSC code."
            )
    return text_value


def _field_validators(
    fields: dict[str, tuple[Any, Any]],
) -> dict[str, Any]:
    validators: dict[str, Any] = {}
    for field_name, (_, field_definition) in fields.items():
        normalized_name = field_name.lower()
        if not (
            normalized_name == "pan"
            or normalized_name.endswith("_pan")
            or normalized_name == "contact_no"
            or normalized_name in {"account_no", "bank_account_no"}
            or re.fullmatch(r"bank_account_no_[0-9]+", normalized_name)
            or normalized_name == "ifsc"
            or normalized_name.endswith("_ifsc")
        ):
            continue

        def validate_value(
            value: Any,
            *,
            _field_name: str = field_name,
            _required: bool = field_definition.is_required(),
        ) -> Any:
            return _normalized_field_value(
                _field_name,
                value,
                required=_required,
            )

        validate_value.__name__ = f"validate_{field_name}"
        validators[validate_value.__name__] = field_validator(
            field_name,
            mode="before",
        )(validate_value)
    return validators


def _column_fields(
    model: type[DeclarativeBase],
    *,
    update: bool = False,
    nested: bool = False,
    response: bool = False,
    exclude_fields: set[str] | None = None,
) -> dict[str, tuple[Any, Any]]:
    fields: dict[str, tuple[Any, Any]] = {}
    child_foreign_key = (
        AR_CHILDREN[model][2]
        if nested and model in AR_CHILDREN
        else None
    )
    for column in model.__table__.columns:
        if column.name in {"created_at", "updated_at"}:
            if not response:
                continue
        if column.primary_key and not response:
            continue
        if column.name == child_foreign_key or (
            exclude_fields is not None and column.name in exclude_fields
        ):
            continue

        field_type = column.type.python_type
        if column.nullable:
            field_type = field_type | None

        if response:
            default: Any = ...
        elif update or column.nullable or column.server_default is not None:
            default = None
        else:
            default = ...

        constraints: dict[str, Any] = {}
        if isinstance(column.type, String) and column.type.length is not None:
            constraints["max_length"] = column.type.length
        if isinstance(column.type, Numeric) and column.type.precision is not None:
            constraints["max_digits"] = column.type.precision
            constraints["decimal_places"] = column.type.scale or 0

        fields[column.name] = (
            field_type,
            Field(default=default, **constraints),
        )
    return fields


def _make_model(
    name: str,
    fields: dict[str, tuple[Any, Any]],
    *,
    from_attributes: bool = False,
) -> type[BaseModel]:
    return create_model(
        name,
        __config__=ConfigDict(
            extra="forbid",
            from_attributes=from_attributes,
        ),
        __validators__=_field_validators(fields),
        **fields,
    )


CREATE_SCHEMAS = {
    model: _make_model(
        f"{model.__name__}Create",
        _column_fields(model),
    )
    for model in AR_MODELS
}
UPDATE_SCHEMAS = {
    model: _make_model(
        f"{model.__name__}Update",
        _column_fields(model, update=True),
    )
    for model in AR_MODELS
}
RESPONSE_SCHEMAS = {
    model: _make_model(
        f"{model.__name__}Response",
        _column_fields(model, response=True),
        from_attributes=True,
    )
    for model in AR_MODELS
}

for header_model, (child_field, child_model, foreign_key) in AR_CHILDREN.items():
    nested_create = _make_model(
        f"{child_model.__name__}NestedCreate",
        _column_fields(
            child_model,
            nested=True,
            exclude_fields={foreign_key},
        ),
    )
    nested_update = _make_model(
        f"{child_model.__name__}NestedUpdate",
        _column_fields(
            child_model,
            update=True,
            nested=True,
            exclude_fields={foreign_key},
        ),
    )
    CREATE_SCHEMAS[header_model] = _make_model(
        f"{header_model.__name__}Create",
        {
            **_column_fields(header_model),
            child_field: (list[nested_create] | None, None),
        },
    )
    UPDATE_SCHEMAS[header_model] = _make_model(
        f"{header_model.__name__}Update",
        {
            **_column_fields(header_model, update=True),
            child_field: (list[nested_update] | None, None),
        },
    )
    RESPONSE_SCHEMAS[header_model] = _make_model(
        f"{header_model.__name__}Response",
        {
            **_column_fields(header_model, response=True),
            child_field: (
                list[RESPONSE_SCHEMAS[child_model]],
                Field(default_factory=list),
            ),
        },
        from_attributes=True,
    )

SCHEMAS = {
    model: (
        CREATE_SCHEMAS[model],
        UPDATE_SCHEMAS[model],
        RESPONSE_SCHEMAS[model],
    )
    for model in AR_MODELS
}
