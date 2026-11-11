"""CRUD endpoints for the Inventory, AR, and GL forms."""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation
from functools import lru_cache
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import MetaData, Table, delete, insert, select, update
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse

from app.api.deps import get_db

router = APIRouter(prefix="/module-forms", tags=["module-forms"])
UPLOAD_DIRECTORY = Path(__file__).resolve().parents[3] / "uploads" / "module-forms"
MAX_IMAGE_SIZE = 10 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


class FormWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payload: dict[str, Any]


class FormConfig(BaseModel):
    table: str
    aliases: dict[str, str] = {}
    children: tuple[str, str, dict[str, str]] | None = None
    lookups: dict[str, tuple[str, str]] = {}
    preserve_empty_fields: set[str] = set()
    lookup_table: str | None = None
    lookup_name: str | None = None


FORMS: dict[str, dict[str, FormConfig]] = {
    "inventory": {
        "units": FormConfig(
            table="inventory_unit_of_measures",
            aliases={"formalName": "name", "numberOfDecimals": "number_of_decimals"},
            lookup_table="inventory_unit_of_measures",
            lookup_name="name",
        ),
        "stock-groups": FormConfig(
            table="inventory_stock_groups",
            aliases={"nameOfGroup": "name", "underGroup": "under_stock_group_id"},
            lookups={"underGroup": ("inventory_stock_groups", "name")},
            lookup_table="inventory_stock_groups",
            lookup_name="name",
        ),
        "stock-items": FormConfig(
            table="inventory_stock_items",
            aliases={
                "nameOfItem": "name",
                "unitOfMeasurement": "unit_of_measure_id",
                "underGroup": "stock_group_id",
                "selectCosting": "select_costing",
            },
            lookups={
                "unitOfMeasurement": ("inventory_unit_of_measures", "symbol"),
                "underGroup": ("inventory_stock_groups", "name"),
            },
            lookup_table="inventory_stock_items",
            lookup_name="name",
        ),
        "indents": FormConfig(
            table="inventory_indents",
            aliases={"indentNumber": "indent_no", "indentDate": "indent_date"},
            children=("inventory_indent_items", "indent_id", {
                "item": "stock_item_id",
                "quantity": "quantity",
            }),
        ),
        "gate-entries": FormConfig(
            table="inventory_gate_entries",
            aliases={
                "gateNumber": "gate_entry_no",
                "date": "entry_date",
                "entryTime": "entry_time",
                "vendorInvoiceNumber": "vendor_invoice_no",
                "vendorInvoiceDate": "vendor_invoice_date",
                "vendorName": "vendor_name",
                "streetNumber": "street_no",
                "zipCode": "zip_code",
                "transporterName": "transporter_name",
                "vehicleNumber": "vehicle_no",
            },
            children=("inventory_gate_entry_items", "gate_entry_id", {
                "item": "stock_item_id",
                "quantity": "quantity",
                "rate": "rate",
            }),
        ),
        "material-receipt-notes": FormConfig(
            table="inventory_material_receipt_notes",
            aliases={
                "receiptNumber": "mrn_no",
                "receiptDate": "mrn_date",
                "entryTime": "mrn_time",
                "vendorInvoiceNumber": "vendor_invoice_no",
                "vendorInvoiceDate": "vendor_invoice_date",
                "vendorName": "vendor_name",
                "streetNumber": "street_no",
                "zipCode": "zip_code",
                "ewayBillNumber": "eway_bill_no",
                "transporterName": "transporter_name",
                "vehicleNumber": "vehicle_no",
                "gateEntryNumber": "gate_entry_id",
            },
            lookups={"gateEntryNumber": ("inventory_gate_entries", "gate_entry_no")},
            children=("inventory_material_receipt_note_items", "mrn_id", {
                "item": "stock_item_id",
                "quantity": "quantity",
                "rate": "rate",
            }),
        ),
        "delivery-challans-inward": FormConfig(
            table="inventory_delivery_challan_inwards",
            aliases={
                "challanNumber": "delivery_challan_no",
                "challanDate": "delivery_challan_date",
                "workOrder": "work_order_no",
                "workOrderDate": "work_order_date",
                "TransporterName": "transporter_name",
                "vehicleNumber": "vehicle_no",
                "ewayBill": "eway_bill_required",
                "ewayBillNumber": "eway_bill_no",
                "streetNumber": "street_no",
                "zipCode": "zip_code",
            },
            children=("inventory_delivery_challan_inward_items", "delivery_challan_inward_id", {
                "item": "stock_item_id",
                "quantity": "quantity",
                "rate": "rate",
                "gst": "gst",
            }),
        ),
        "delivery-challans-outward": FormConfig(
            table="inventory_delivery_challans",
            aliases={
                "challanNumber": "delivery_challan_no",
                "challanDate": "delivery_challan_date",
                "TransporterName": "transporter_name",
                "vehicleNumber": "vehicle_no",
                "ewayBill": "eway_bill_required",
                "ewayBillNumber": "eway_bill_no",
            },
            children=("inventory_delivery_challan_items", "delivery_challan_id", {
                "item": "stock_item_id",
                "quantity": "quantity",
                "rate": "rate",
                "gst": "gst",
            }),
        ),
        "goods-issues": FormConfig(
            table="inventory_goods_issues",
            aliases={"issueDate": "indent_date", "indentId": "indent_id"},
            lookups={"indentId": ("inventory_indents", "indent_no")},
            children=("inventory_goods_issue_items", "goods_issue_id", {
                "item": "stock_item_id",
                "quantity": "quantity",
            }),
        ),
        "goods-issue-sales": FormConfig(
            table="inventory_goods_issue_sales",
            children=("inventory_goods_issue_sale_items", "goods_issue_sale_id", {
                "item": "stock_item_id",
                "quantity": "quantity",
                "costElementId": "cost_element_id",
            }),
        ),
    },
    "ar": {
        "customers": FormConfig(
            table="ar_customers",
            aliases={
                "customerName": "customer_name",
                "email": "email_id",
                "phone": "contact_no",
                "billToAddress": "bill_to_address",
                "billToStreetNumber": "street_number",
                "billToStreetName": "street_name",
                "billToCity": "city",
                "billToState": "state",
                "billToCountry": "country",
                "billToPin": "pin",
                "billToPan": "pan",
                "billToGstin": "gstn",
                "shipToAddress": "ship_to_address",
                "shipToStreetNumber": "ship_to_street_number",
                "shipToStreetName": "ship_to_street_name",
                "shipToCity": "ship_to_city",
                "shipToState": "ship_to_state",
                "shipToCountry": "ship_to_country",
                "shipToPin": "ship_to_pin",
                "contactPerson": "contact_person_name",
                "msmestatus": "msme_status",
                "msmeNumber": "msme_no",
                "Activity": "activity",
            },
            children=("ar_customer_bank_accounts", "customer_id", {
                "accountNumber": "account_no",
                "ifscCode": "ifsc",
            }),
            lookup_table="ar_customers",
            lookup_name="customer_name",
        ),
        "quotations": FormConfig(
            table="ar_quotations",
            aliases={
                "quotationNumber": "quotation_no",
                "quotationDate": "quotation_date",
                "customer": "customer_id",
                "streetNumber": "street_number",
                "streetName": "street_name",
                "pin": "pin",
                "itemcount": "item_count",
                "termsofdelivery": "terms_of_delivery",
                "paymentterms": "terms_of_payment",
            },
            lookups={"customer": ("ar_customers", "customer_name")},
            children=("ar_quotation_items", "quotation_id", {
                "item": "product_item_description",
                "quantity": "quantity",
                "rate": "rate",
                "amount": "amount",
            }),
        ),
        "proforma-invoices": FormConfig(
            table="ar_proforma_invoices",
            aliases={
                "proformaNumber": "proforma_invoice_no",
                "issueDate": "proforma_invoice_date",
                "invoiceType": "proforma_invoice_type",
                "quotationNumber": "quotation_id",
                "orderBy": "order_by",
                "asm": "asm",
                "consignee": "consignee_customer_id",
                "consigneeStreetNumber": "consignee_street_number",
                "consigneeStreetName": "consignee_street_name",
                "consigneeCity": "consignee_city",
                "consigneeState": "consignee_state",
                "consigneeCountry": "consignee_country",
                "consigneePin": "consignee_zip_code",
                "consigneePan": "consignee_pan",
                "consigneeGstin": "consignee_gstn",
                "buyer": "buyer_customer_id",
                "buyerStreetNumber": "buyer_street_number",
                "buyerStreetName": "buyer_street_name",
                "buyerCity": "buyer_city",
                "buyerState": "buyer_state",
                "buyerCountry": "buyer_country",
                "buyerPin": "buyer_zip_code",
                "buyerPan": "buyer_pan",
                "buyerGstin": "buyer_gstn",
                "termsOfDelivery": "terms_of_delivery",
                "paymentTerms": "terms_of_payment",
            },
            lookups={
                "buyer": ("ar_customers", "customer_name"),
                "consignee": ("ar_customers", "customer_name"),
                "quotationNumber": ("ar_quotations", "quotation_no"),
            },
            children=("ar_proforma_invoice_items", "proforma_invoice_id", {
                "serialNumber": "sl_no",
                "item": "item_name",
                "description": "description",
                "hsn": "hsn",
                "quantity": "quantity",
                "rate": "rate",
                "uom": "uom",
                "amount": "value",
                "gstrate": "gst_rate",
            }),
        ),
        "invoices": FormConfig(
            table="ar_invoices",
            aliases={
                "invoiceNumber": "invoice_no",
                "invoiceDate": "invoice_date",
                "invoiceType": "invoice_type",
                "proformaInvoiceNumber": "proforma_invoice_id",
                "quotationNumber": "quotation_id",
                "orderby": "order_by",
                "dueDate": "due_date",
                "amountDue": "total",
                "consignee": "consignee_customer_id",
                "consigneeStreetNumber": "consignee_street_number",
                "consigneeStreetName": "consignee_street_name",
                "consigneeCity": "consignee_city",
                "consigneeState": "consignee_state",
                "consigneeCountry": "consignee_country",
                "consigneePin": "consignee_zip_code",
                "consigneePan": "consignee_pan",
                "consigneeGstin": "consignee_gstn",
                "buyer": "buyer_customer_id",
                "buyerStreetNumber": "buyer_street_number",
                "buyerStreetName": "buyer_street_name",
                "buyerCity": "buyer_city",
                "buyerState": "buyer_state",
                "buyerCountry": "buyer_country",
                "buyerPin": "buyer_zip_code",
                "buyerPan": "buyer_pan",
                "buyerGstin": "buyer_gstn",
                "gstrate": "gst_rate",
                "hsn": "hsn",
                "uom": "uom",
                "amount": "value",
            },
            lookups={
                "buyer": ("ar_customers", "customer_name"),
                "consignee": ("ar_customers", "customer_name"),
                "quotationNumber": ("ar_quotations", "quotation_no"),
                "proformaInvoiceNumber": ("ar_proforma_invoices", "proforma_invoice_no"),
            },
            children=("ar_invoice_items", "invoice_id", {
                "serialNumber": "sl_no",
                "item": "item_name",
                "description": "description",
                "hsn": "hsn",
                "quantity": "quantity",
                "rate": "rate",
                "uom": "uom",
                "amount": "value",
                "gstrate": "gst_rate",
            }),
        ),
        "tax-invoices": FormConfig(
            table="ar_tax_invoices",
            aliases={
                "invoiceNumber": "invoice_no",
                "invoiceDate": "invoice_date",
                "customer": "buyer_customer_id",
                "taxAmount": "gst",
                "totalDue": "grand_total",
            },
            lookups={"customer": ("ar_customers", "customer_name")},
            children=("ar_tax_invoice_items", "tax_invoice_id", {
                "serialNumber": "sl_no",
                "item": "item_name",
                "description": "description",
                "quantity": "quantity",
                "rate": "rate",
                "amount": "value",
            }),
        ),
    },
    "gl": {
        "tax-types": FormConfig(
            table="gl_tax_types",
            aliases={"taxTypeName": "name", "taxRate": "rate", "glAccount": "gl_account_id"},
            lookups={"glAccount": ("gl_accounts", "name")},
            lookup_table="gl_tax_types",
            lookup_name="name",
        ),
        "groups": FormConfig(
            table="gl_groups",
            aliases={"groupName": "name", "parentGroup": "parent_group_id", "groupCode": "group_code"},
            lookups={"parentGroup": ("gl_groups", "name")},
            lookup_table="gl_groups",
            lookup_name="name",
        ),
        "accounts": FormConfig(
            table="gl_accounts",
            aliases={
                "glAccountName": "name",
                "group": "group_id",
                "glAccountCode": "account_code",
                "taxApplicable": "tax_applicable",
                "taxType": "tax_type_id",
                "costingApplicable": "costing_applicable",
                "depreciationApplicable": "depreciation_applicable",
                "loanDate": "loan_taken_date",
                "rateOfInterest": "interest_rate",
                "effectiveDate": "interest_effective_date",
                "maintainBillWise": "maintain_bill_wise",
                "defaultCreditDays": "default_credit_days",
                "checkCreditDays": "check_credit_days_on_voucher",
            },
            lookups={
                "group": ("gl_groups", "name"),
                "taxType": ("gl_tax_types", "name"),
            },
            lookup_table="gl_accounts",
            lookup_name="name",
        ),
        "tax-applicability": FormConfig(
            table="gl_accounts",
            aliases={
                "accountId": "id",
                "taxType": "tax_type_id",
                "hsnSacType": "hsn_sac_type",
                "hsnCode": "hsn_id",
                "sacCode": "sac_id",
            },
            lookups={
                "accountId": ("gl_accounts", "name"),
                "taxType": ("gl_tax_types", "name"),
                "hsnCode": ("gl_hsn_master", "hsn_code"),
                "sacCode": ("gl_sac_master", "sac_code"),
            },
            lookup_table="gl_accounts",
            lookup_name="name",
        ),
        "hsn-masters": FormConfig(
            table="gl_hsn_master",
            aliases={
                "subHeading": "sub_heading",
                "hsnCode": "hsn_code",
                "hsnDescription": "description",
                "sgstRate": "sgst_utgst_rate",
            },
            lookup_table="gl_hsn_master",
            lookup_name="hsn_code",
        ),
        "sac-masters": FormConfig(
            table="gl_sac_master",
            aliases={"sacCode": "sac_code", "sacDescription": "description", "sgstRate": "sgst_utgst_rate"},
            lookup_table="gl_sac_master",
            lookup_name="sac_code",
        ),
        "bank-accounts": FormConfig(
            table="gl_bank_accounts",
            aliases={
                "accountNumber": "account_number",
                "ifscCode": "ifsc_code",
                "enableEpayments": "enable_e_payments",
            },
            lookup_table="gl_bank_accounts",
            lookup_name="account_number",
        ),
        "cheque-ranges": FormConfig(
            table="gl_cheque_ranges",
            aliases={"accountNumber": "bank_account_id", "fromNumber": "from_number", "toNumber": "to_number"},
            lookups={"accountNumber": ("gl_bank_accounts", "account_number")},
            preserve_empty_fields={"chequeImage"},
        ),
        "od-limits": FormConfig(
            table="gl_od_limits",
            aliases={"accountNumber": "bank_account_id", "odLimit": "od_limit", "rateOfInterest": "rate_of_interest"},
            lookups={"accountNumber": ("gl_bank_accounts", "account_number")},
        ),
        "fixed-assets": FormConfig(
            table="gl_accounts",
            aliases={"accountId": "id", "depreciationApplicable": "depreciation_applicable"},
            lookups={"accountId": ("gl_accounts", "name")},
            lookup_table="gl_accounts",
            lookup_name="name",
        ),
        "secured-loans": FormConfig(
            table="gl_secured_loans",
            aliases={
                "accountId": "account_id",
                "loanDate": "loan_taken_date",
                "rateOfInterest": "interest_rate",
                "effectiveDate": "interest_effective_date",
            },
            lookups={"accountId": ("gl_accounts", "name")},
            lookup_table="gl_accounts",
            lookup_name="name",
        ),
        "unsecured-loans": FormConfig(
            table="gl_unsecured_loans",
            aliases={
                "accountId": "account_id",
                "loanDate": "loan_taken_date",
                "rateOfInterest": "interest_rate",
                "effectiveDate": "interest_effective_date",
            },
            lookups={"accountId": ("gl_accounts", "name")},
            lookup_table="gl_accounts",
            lookup_name="name",
        ),
        "sundry-creditors": FormConfig(
            table="gl_sundry_creditors",
            aliases={
                "accountId": "account_id",
                "maintainBillWise": "maintain_bill_wise",
                "defaultCreditDays": "default_credit_days",
                "checkCreditDays": "check_credit_days_on_voucher_entry",
            },
            lookups={"accountId": ("gl_accounts", "name")},
            lookup_table="gl_sundry_creditors",
            lookup_name="account_id",
        ),
        "sundry-debtors": FormConfig(
            table="gl_sundry_debtors",
            aliases={
                "accountId": "account_id",
                "maintainBillWise": "maintain_bill_wise",
                "defaultCreditDays": "default_credit_days",
                "checkCreditDays": "check_credit_days_on_voucher_entry",
            },
            lookups={"accountId": ("gl_accounts", "name")},
            lookup_table="gl_sundry_debtors",
            lookup_name="account_id",
        ),
    },
}

LOOKUP_TABLES = {
    "customers": ("ar_customers", "id", "customer_name"),
    "groups": ("gl_groups", "id", "name"),
    "accounts": ("gl_accounts", "id", "name"),
    "tax-types": ("gl_tax_types", "id", "name"),
    "bank-accounts": ("gl_bank_accounts", "id", "account_number"),
    "stock-items": ("inventory_stock_items", "id", "name"),
    "stock-groups": ("inventory_stock_groups", "id", "name"),
    "units": ("inventory_unit_of_measures", "id", "symbol"),
    "gate-entries": ("inventory_gate_entries", "id", "gate_entry_no"),
    "hsn-masters": ("gl_hsn_master", "id", "hsn_code"),
    "sac-masters": ("gl_sac_master", "id", "sac_code"),
    "quotations": ("ar_quotations", "id", "quotation_no"),
    "proforma-invoices": ("ar_proforma_invoices", "id", "proforma_invoice_no"),
    "indents": ("inventory_indents", "id", "indent_no"),
}

LOOKUP_MODULES = {
    "inventory": {"stock-items", "stock-groups", "units", "gate-entries", "indents", "accounts"},
    "ar": {"customers", "quotations", "proforma-invoices"},
    "gl": {"groups", "accounts", "tax-types", "bank-accounts", "hsn-masters", "sac-masters"},
}


@lru_cache(maxsize=64)
def _table(name: str, bind) -> Table:
    return Table(name, MetaData(), autoload_with=bind, resolve_fks=False)


def _config(module: str, resource: str) -> FormConfig:
    config = FORMS.get(module, {}).get(resource)
    if config is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form resource not found")
    return config


def _parse_value(value: Any, column) -> Any:
    if value is None or value == "":
        return None
    python_type = column.type.python_type
    if python_type is bool:
        if isinstance(value, bool):
            return value
        normalized = str(value).strip().lower()
        if normalized in ("yes", "true", "1", "required"):
            return True
        if normalized in ("no", "false", "0", "not required"):
            return False
        raise ValueError(f"{column.name} must be a boolean value")
    if python_type is date and not isinstance(value, date):
        return date.fromisoformat(str(value))
    if python_type is datetime and not isinstance(value, datetime):
        return datetime.fromisoformat(str(value))
    if python_type is time and not isinstance(value, time):
        return time.fromisoformat(str(value))
    if python_type is Decimal:
        return Decimal(str(value))
    if python_type is int:
        return int(value)
    if python_type is float:
        return float(value)
    return str(value) if python_type is str else value


def _to_snake_case(value: str) -> str:
    import re
    return re.sub(r"(?<!^)(?=[A-Z])", "_", value).lower()


def _to_camel_case(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


def _validate_required(table: Table, values: dict[str, Any]) -> None:
    missing = [
        column.name
        for column in table.c
        if not column.nullable
        and not column.primary_key
        and column.default is None
        and column.server_default is None
        and column.computed is None
        and column.name not in values
    ]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")


def _validate_tax_applicability(
    values: dict[str, Any],
    existing: dict[str, Any] | None = None,
    payload: dict[str, Any] | None = None,
) -> None:
    current = existing or {}
    form_payload = current.get("form_payload") or {}
    submitted = payload or {}
    values["tax_applicable"] = True
    hsn_sac_type = values.get("hsn_sac_type", current.get("hsn_sac_type"))
    hsn_id = values.get("hsn_id", current.get("hsn_id"))
    sac_id = values.get("sac_id", current.get("sac_id"))
    applicability = submitted.get("hsnSacApplicable", form_payload.get("hsnSacApplicable"))
    if applicability == "Not Applicable":
        hsn_sac_type = "Not Applicable"
        values["hsn_sac_type"] = hsn_sac_type
        values.update(hsn_id=None, sac_id=None)
    if hsn_sac_type == "HSN":
        if not hsn_id:
            raise ValueError("Select an HSN code")
        values["sac_id"] = None
    elif hsn_sac_type == "SAC":
        if not sac_id:
            raise ValueError("Select a SAC code")
        values["hsn_id"] = None
    elif hsn_sac_type == "Not Applicable":
        values.update(hsn_id=None, sac_id=None)
    elif applicability == "Applicable":
        raise ValueError("Select an HSN/SAC type")


def _db_values(
    payload: dict[str, Any],
    config: FormConfig,
    table,
    db: Session,
    *,
    clear_empty: bool = False,
) -> tuple[dict[str, Any], dict[str, Any]]:
    aliases = config.aliases
    values: dict[str, Any] = {}
    supplemental: dict[str, Any] = {}
    child_fields = set(config.children[2]) if config.children else set()
    for key, value in payload.items():
        if key == "items" or key in child_fields:
            continue
        column_name = aliases.get(key, _to_snake_case(key))
        if column_name == "id":
            continue
        if column_name not in table.c or column_name == "id":
            supplemental[key] = value
            continue
        if table.c[column_name].computed is not None:
            continue
        if value in ("", None):
            if clear_empty and key not in config.preserve_empty_fields:
                column = table.c[column_name]
                if column.nullable:
                    values[column_name] = None
                elif column.server_default is None and column.default is None:
                    raise ValueError(f"{key} is required")
            continue
        if key in config.lookups:
            lookup_table_name, lookup_column = config.lookups[key]
            lookup_table = _table(lookup_table_name, db.get_bind())
            target_type = table.c[column_name].type.python_type
            if str(value).isdigit():
                lookup_id = int(value)
                label = db.execute(
                    select(lookup_table.c[lookup_column]).where(lookup_table.c.id == lookup_id)
                ).scalar_one_or_none()
                if target_type is int:
                    match = lookup_id if label is not None else None
                else:
                    match = label
            else:
                lookup_match = db.execute(
                    select(lookup_table.c.id, lookup_table.c[lookup_column])
                    .where(lookup_table.c[lookup_column] == value)
                ).one_or_none()
                match = lookup_match[0] if lookup_match and target_type is int else (
                    lookup_match[1] if lookup_match else None
                )
            if match is None:
                raise ValueError(f"{key} does not match an existing record")
            if lookup_table_name == "ar_customers":
                if column_name == "buyer_customer_id" and "buyer_customer_name" in table.c:
                    values["buyer_customer_name"] = label if str(value).isdigit() else lookup_match[1]
                elif column_name == "consignee_customer_id" and "consignee_customer_name" in table.c:
                    values["consignee_customer_name"] = label if str(value).isdigit() else lookup_match[1]
            value = match
        if key == "hsnSacType":
            value = {
                "Goods - HSN": "HSN",
                "Services - SAC": "SAC",
            }.get(str(value), value)
        if key == "Activity":
            value = {
                "Manufacturing": "Manufacturer",
                "Service": "Service Provider",
                "Trading": "Trader",
            }.get(str(value), value)
        values[column_name] = _parse_value(value, table.c[column_name])
    if "form_payload" in table.c:
        values["form_payload"] = supplemental
    elif supplemental:
        raise ValueError(f"This form has fields that are not supported by its database schema: {', '.join(supplemental)}")
    return values, supplemental


def _read_payload(record: dict[str, Any], config: FormConfig, db: Session) -> dict[str, Any]:
    table = _table(config.table, db.get_bind())
    payload = dict(record.get("form_payload") or {})
    mapped_columns: dict[str, str] = {}
    for key, column_name in config.aliases.items():
        if key == "id" or column_name not in table.c or column_name == "form_payload":
            continue
        mapped_columns[column_name] = key
    for column in table.c:
        if column.name in ("id", "created_at", "updated_at", "form_payload"):
            continue
        target = mapped_columns.get(column.name, _to_camel_case(column.name))
        if record.get(column.name) is not None:
            value = record[column.name]
            if isinstance(value, bool):
                value = "Yes" if value else "No"
            if target == "hsnSacType":
                value = {"HSN": "Goods - HSN", "SAC": "Services - SAC"}.get(value, value)
            if target == "Activity":
                value = {
                    "Manufacturer": "Manufacturing",
                    "Service Provider": "Service",
                    "Trader": "Trading",
                }.get(value, value)
            payload[target] = value
    for key, column_name in config.aliases.items():
        if column_name == "id" and key != "id":
            payload[key] = record["id"]
    if config.children:
        child_name, foreign_key, child_aliases = config.children
        child_table = _table(child_name, db.get_bind())
        children = db.execute(
            select(child_table).where(child_table.c[foreign_key] == record["id"]).order_by(child_table.c.id)
        ).mappings().all()
        if children:
            child = dict(children[0])
            for key, column_name in child_aliases.items():
                if column_name in child and child[column_name] is not None:
                    payload[key] = child[column_name]
    return payload


def _read_record(record: dict[str, Any], config: FormConfig, db: Session) -> dict[str, Any]:
    return {"id": record["id"], "payload": _read_payload(record, config, db)}


def _insert_children(payload: dict[str, Any], config: FormConfig, record_id: Any, db: Session) -> None:
    if not config.children:
        return
    child_name, foreign_key, child_aliases = config.children
    child_table = _table(child_name, db.get_bind())
    item_payload: dict[str, Any] | None = None
    raw_items = payload.get("items")
    if isinstance(raw_items, str) and raw_items.strip():
        try:
            import json
            decoded = json.loads(raw_items)
            if isinstance(decoded, list) and decoded and isinstance(decoded[0], dict):
                item_payload = decoded[0]
        except ValueError:
            item_payload = None
    if item_payload is None:
        item_payload = payload
    values: dict[str, Any] = {foreign_key: record_id}
    for key, column_name in child_aliases.items():
        raw_value = item_payload.get(key)
        if raw_value in (None, ""):
            continue
        if key == "item" and column_name == "stock_item_id":
            if str(raw_value).isdigit():
                item_id = int(raw_value)
            else:
                stock_items = _table("inventory_stock_items", db.get_bind())
                item_id = db.execute(
                    select(stock_items.c.id).where(stock_items.c.name == raw_value)
                ).scalar_one_or_none()
                if item_id is None:
                    raise ValueError("Item must match an existing stock item")
            raw_value = item_id
        values[column_name] = _parse_value(raw_value, child_table.c[column_name])
    for column in child_table.c:
        if (
            column.name in ("sl_no", "item_no")
            and column.name not in values
            and not column.nullable
            and column.default is None
            and column.server_default is None
        ):
            values[column.name] = 1
    if len(values) > 1:
        _validate_required(child_table, values)
        db.execute(insert(child_table).values(**values))


def _rollback_as_http_error(db: Session, error: Exception) -> None:
    db.rollback()
    if isinstance(error, HTTPException):
        raise error
    if isinstance(error, (ValueError, InvalidOperation)):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    if isinstance(error, IntegrityError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Record violates a database constraint or foreign-key relationship",
        ) from error
    if isinstance(error, SQLAlchemyError):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database operation failed",
        ) from error
    raise error


def _run_db(operation):
    try:
        return operation()
    except HTTPException:
        raise
    except (ValueError, InvalidOperation) as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Record violates a database constraint or foreign-key relationship",
        ) from error
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database operation failed",
        ) from error


@router.get("/{module}/lookups/{resource}")
def list_form_lookups(module: str, resource: str, db: Session = Depends(get_db)):
    lookup = LOOKUP_TABLES.get(resource)
    if lookup is None or resource not in LOOKUP_MODULES.get(module, set()):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lookup resource not found")
    table_name, id_column, label_column = lookup
    table = _table(table_name, db.get_bind())
    return _run_db(lambda: [
        {"id": row[id_column], "label": row[label_column]}
        for row in db.execute(
            select(table.c[id_column], table.c[label_column]).order_by(table.c[label_column]).limit(1000)
        ).mappings()
    ])


@router.post("/gl/uploads", status_code=status.HTTP_201_CREATED)
async def upload_cheque_image(file: UploadFile = File(...)) -> dict[str, str]:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cheque image must be a JPG, JPEG, or PNG file.",
        )
    contents = await file.read(MAX_IMAGE_SIZE + 1)
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Cheque image exceeds the 10 MB limit.",
        )
    stored_name = f"{uuid4().hex}{extension}"
    UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIRECTORY / stored_name).write_bytes(contents)
    return {"path": f"/api/v1/module-forms/gl/uploads/{stored_name}"}


@router.get("/gl/uploads/{file_name}", include_in_schema=False)
def get_cheque_image(file_name: str) -> FileResponse:
    if Path(file_name).name != file_name or Path(file_name).suffix.lower() not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cheque image not found.")
    path = UPLOAD_DIRECTORY / file_name
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cheque image not found.")
    return FileResponse(path)


@router.get("/{module}/{resource}")
def list_form_records(module: str, resource: str, db: Session = Depends(get_db)):
    config = _config(module, resource)
    table = _table(config.table, db.get_bind())
    records = _run_db(lambda: db.execute(select(table).order_by(table.c.id.desc()).limit(500)).mappings().all())
    return [_read_record(dict(record), config, db) for record in records]


@router.get("/{module}/{resource}/{record_id}")
def get_form_record(module: str, resource: str, record_id: int, db: Session = Depends(get_db)):
    config = _config(module, resource)
    table = _table(config.table, db.get_bind())
    record = _run_db(lambda: db.execute(select(table).where(table.c.id == record_id)).mappings().one_or_none())
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form record not found")
    return _read_record(dict(record), config, db)


@router.post("/{module}/{resource}", status_code=status.HTTP_201_CREATED)
def create_form_record(module: str, resource: str, request: FormWrite, db: Session = Depends(get_db)):
    config = _config(module, resource)
    table = _table(config.table, db.get_bind())
    try:
        values, _ = _db_values(request.payload, config, table, db)
        if resource in ("fixed-assets", "tax-applicability"):
            account_id = request.payload.get("accountId")
            if account_id in (None, ""):
                raise ValueError("Select an existing GL account")
            existing = db.execute(select(table).where(table.c.id == int(account_id))).mappings().one_or_none()
            if existing is None:
                raise ValueError("Selected GL account does not exist")
            if resource == "tax-applicability":
                _validate_tax_applicability(values, dict(existing), request.payload)
                if values.get("form_payload"):
                    values["form_payload"] = {
                        **(existing.get("form_payload") or {}),
                        **values["form_payload"],
                    }
            if values.get("form_payload") == {}:
                values.pop("form_payload")
            db.execute(update(table).where(table.c.id == int(account_id)).values(**values))
            record = db.execute(select(table).where(table.c.id == int(account_id))).mappings().one()
            db.commit()
            return _read_record(dict(record), config, db)
        _validate_required(table, values)
        result = db.execute(insert(table).values(**values).returning(table))
        record = dict(result.mappings().one())
        _insert_children(request.payload, config, record["id"], db)
        db.commit()
        return _read_record(record, config, db)
    except HTTPException as error:
        _rollback_as_http_error(db, error)
    except (ValueError, InvalidOperation, IntegrityError, SQLAlchemyError) as error:
        _rollback_as_http_error(db, error)


@router.put("/{module}/{resource}/{record_id}")
def update_form_record(
    module: str,
    resource: str,
    record_id: int,
    request: FormWrite,
    db: Session = Depends(get_db),
):
    config = _config(module, resource)
    table = _table(config.table, db.get_bind())
    try:
        existing = db.execute(select(table).where(table.c.id == record_id)).mappings().one_or_none()
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form record not found")
        if resource in ("fixed-assets", "tax-applicability"):
            selected_account = request.payload.get("accountId")
            if selected_account not in (None, "") and int(selected_account) != record_id:
                raise ValueError("The selected GL account cannot be changed while editing this record")
        values, _ = _db_values(request.payload, config, table, db, clear_empty=True)
        values.pop("id", None)
        if resource == "tax-applicability":
            _validate_tax_applicability(values, dict(existing), request.payload)
            if values.get("form_payload"):
                values["form_payload"] = {
                    **(existing.get("form_payload") or {}),
                    **values["form_payload"],
                }
        if resource in ("fixed-assets", "tax-applicability") and values.get("form_payload") == {}:
            values.pop("form_payload")
        if values:
            db.execute(update(table).where(table.c.id == record_id).values(**values))
        if config.children:
            child_name, foreign_key, _ = config.children
            child_table = _table(child_name, db.get_bind())
            db.execute(delete(child_table).where(child_table.c[foreign_key] == record_id))
            _insert_children(request.payload, config, record_id, db)
        db.commit()
        record = db.execute(select(table).where(table.c.id == record_id)).mappings().one()
        return _read_record(dict(record), config, db)
    except HTTPException as error:
        _rollback_as_http_error(db, error)
    except (ValueError, InvalidOperation, IntegrityError, SQLAlchemyError) as error:
        _rollback_as_http_error(db, error)


@router.delete("/{module}/{resource}/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form_record(module: str, resource: str, record_id: int, db: Session = Depends(get_db)):
    config = _config(module, resource)
    table = _table(config.table, db.get_bind())
    try:
        if resource in ("fixed-assets", "tax-applicability"):
            raise HTTPException(
                status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
                detail="This record belongs to a GL account; update the account instead of deleting it.",
            )
        result = db.execute(delete(table).where(table.c.id == record_id))
        if result.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form record not found")
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException as error:
        _rollback_as_http_error(db, error)
    except (ValueError, InvalidOperation, IntegrityError, SQLAlchemyError) as error:
        _rollback_as_http_error(db, error)
