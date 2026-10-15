from functools import lru_cache
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, ConfigDict, create_model
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    Integer,
    Numeric,
    String,
    Time,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Session

from app.api.deps import get_db
from app.hr.recruitment.models import PreviousEmployment, UserEnquiry
from app.models.attendance import Attendance
from app.models.attendance_coe import AttendanceCOE
from app.models.company_holiday import CompanyHoliday
from app.models.employment import Employment
from app.models.gl_account import GLAccount
from app.models.gl_account_details import (
    GLSecuredLoan,
    GLSundryCreditor,
    GLSundryDebtor,
    GLUnsecuredLoan,
)
from app.models.gl_bank_account import GLBankAccount
from app.models.gl_cheque_range import GLChequeRange
from app.models.gl_group import GLGroup
from app.models.gl_hsn_master import GLHSNMaster
from app.models.gl_od_limit import GLOdLimit
from app.models.gl_sac_master import GLSACMaster
from app.models.gl_tax_type import GLTaxType
from app.models.job_profile import JobProfile
from app.models.on_employment import OnEmployment
from app.models.paysheet import Paysheet
from app.models.salary_details import SalaryDetails
from app.models.travelling_advance import TravellingAdvance
from app.models.travelling_expenses_reimbursement import (
    TravellingExpensesReimbursement,
)
from app.models.user import User
from app.modules.inventory.models import (
    InventoryDeliveryChallan,
    InventoryDeliveryChallanInward,
    InventoryDeliveryChallanInwardItem,
    InventoryDeliveryChallanItem,
    InventoryGateEntry,
    InventoryGateEntryItem,
    InventoryGoodsIssue,
    InventoryGoodsIssueItem,
    InventoryGoodsIssueSale,
    InventoryGoodsIssueSaleItem,
    InventoryIndent,
    InventoryIndentItem,
    InventoryMaterialReceiptNote,
    InventoryMaterialReceiptNoteItem,
    InventoryStockGroup,
    InventoryStockItem,
    InventoryUnitOfMeasure,
)
from app.modules.hr.payroll.models import Payroll


RESOURCE_MODELS: dict[
    str, dict[str, tuple[str, type[DeclarativeBase]]]
] = {
    "hr": {
        "user-enquiries": ("User Enquiries", UserEnquiry),
        "previous-employments": ("Previous Employments", PreviousEmployment),
        "employee-profiles": ("Employee Profiles", User),
        "attendance": ("Attendance", Attendance),
        "attendance-cost-of-elements": (
            "Attendance Cost of Elements",
            AttendanceCOE,
        ),
        "employment-details": ("Employment Details", Employment),
        "job-profiles": ("Job Profiles", JobProfile),
        "on-employment": ("On Employment", OnEmployment),
        "salary-details": ("Salary Details", SalaryDetails),
        "payroll": ("Payroll", Payroll),
        "paysheets": ("Paysheets", Paysheet),
        "travelling-advances": ("Travelling Advances", TravellingAdvance),
        "travelling-expenses-reimbursements": (
            "Travelling Expenses Reimbursements",
            TravellingExpensesReimbursement,
        ),
        "company-holidays": ("Company Holidays", CompanyHoliday),
    },
    "gl": {
        "groups": ("GL Groups", GLGroup),
        "accounts": ("GL Accounts", GLAccount),
        "bank-accounts": ("GL Bank Accounts", GLBankAccount),
        "cheque-ranges": ("GL Cheque Ranges", GLChequeRange),
        "hsn-masters": ("GL HSN Masters", GLHSNMaster),
        "sac-masters": ("GL SAC Masters", GLSACMaster),
        "tax-types": ("GL Tax Types", GLTaxType),
        "od-limits": ("GL OD Limits", GLOdLimit),
        "sundry-creditors": ("GL Sundry Creditors", GLSundryCreditor),
        "sundry-debtors": ("GL Sundry Debtors", GLSundryDebtor),
        "secured-loans": ("GL Secured Loans", GLSecuredLoan),
        "unsecured-loans": ("GL Unsecured Loans", GLUnsecuredLoan),
    },
    "inventory": {
        "unit-of-measures": ("Units of Measure", InventoryUnitOfMeasure),
        "stock-groups": ("Stock Groups", InventoryStockGroup),
        "stock-items": ("Stock Items", InventoryStockItem),
        "indents": ("Indents", InventoryIndent),
        "indent-items": ("Indent Items", InventoryIndentItem),
        "gate-entries": ("Gate Entries", InventoryGateEntry),
        "gate-entry-items": ("Gate Entry Items", InventoryGateEntryItem),
        "material-receipt-notes": (
            "Material Receipt Notes",
            InventoryMaterialReceiptNote,
        ),
        "material-receipt-note-items": (
            "Material Receipt Note Items",
            InventoryMaterialReceiptNoteItem,
        ),
        "delivery-challans": (
            "Delivery Challans",
            InventoryDeliveryChallan,
        ),
        "delivery-challan-items": (
            "Delivery Challan Items",
            InventoryDeliveryChallanItem,
        ),
        "delivery-challan-inwards": (
            "Delivery Challan Inwards",
            InventoryDeliveryChallanInward,
        ),
        "delivery-challan-inward-items": (
            "Delivery Challan Inward Items",
            InventoryDeliveryChallanInwardItem,
        ),
        "goods-issues": ("Goods Issues", InventoryGoodsIssue),
        "goods-issue-items": ("Goods Issue Items", InventoryGoodsIssueItem),
        "goods-issue-sales": ("Goods Issue Sales", InventoryGoodsIssueSale),
        "goods-issue-sale-items": (
            "Goods Issue Sale Items",
            InventoryGoodsIssueSaleItem,
        ),
    },
}

router = APIRouter(
    prefix="/admin",
    tags=["Administrator record management"],
)


def _resource(
    module: str,
    resource_key: str,
) -> tuple[str, type[DeclarativeBase]]:
    module_resources = RESOURCE_MODELS.get(module)
    if module_resources is None:
        raise HTTPException(
            status_code=404,
            detail="Administrator module not found.",
        )

    resource = module_resources.get(resource_key)
    if resource is None:
        raise HTTPException(
            status_code=404,
            detail="Administrator resource not found.",
        )

    return resource


def _column_type(column: Any) -> tuple[str, type[Any]]:
    sql_type = column.type

    if isinstance(sql_type, Boolean):
        return "boolean", bool
    if isinstance(sql_type, DateTime):
        return "datetime", column.type.python_type
    if isinstance(sql_type, Date):
        return "date", column.type.python_type
    if isinstance(sql_type, Time):
        return "time", column.type.python_type
    if isinstance(sql_type, Integer):
        return "number", int
    if isinstance(sql_type, (Numeric, Float)):
        return "number", column.type.python_type
    if isinstance(sql_type, Enum):
        return "select", str
    if isinstance(sql_type, String):
        return "text", str

    try:
        python_type = column.type.python_type
    except (AttributeError, NotImplementedError):
        python_type = str

    return "text", python_type


def _model_fields(model: type[DeclarativeBase]) -> list[dict[str, Any]]:
    fields: list[dict[str, Any]] = []

    for attribute in model.__mapper__.column_attrs:
        column = attribute.columns[0]
        kind, _ = _column_type(column)

        read_only = (
            column.primary_key
            or attribute.key in {"created_at", "updated_at"}
            or column.computed is not None
        )

        field: dict[str, Any] = {
            "name": attribute.key,
            "label": attribute.key.replace("_", " ").strip().title(),
            "kind": kind,
            "nullable": column.nullable,
            "editable": not read_only,
        }

        if isinstance(column.type, String) and column.type.length:
            field["max_length"] = column.type.length

        if isinstance(column.type, Enum):
            field["options"] = list(column.type.enums)

        fields.append(field)

    return fields


@lru_cache(maxsize=None)
def _update_schema(model: type[DeclarativeBase]) -> type[BaseModel]:
    schema_fields: dict[str, tuple[Any, Any]] = {}

    for attribute in model.__mapper__.column_attrs:
        column = attribute.columns[0]

        if (
            column.primary_key
            or attribute.key in {"created_at", "updated_at"}
            or column.computed is not None
        ):
            continue

        _, python_type = _column_type(column)
        schema_fields[attribute.key] = (python_type | None, None)

    return create_model(
        f"{model.__name__}AdminUpdate",
        __config__=ConfigDict(extra="forbid"),
        **schema_fields,
    )


def _primary_key(model: type[DeclarativeBase]) -> Any:
    primary_keys = [
        attribute
        for attribute in model.__mapper__.column_attrs
        if any(column.primary_key for column in attribute.columns)
    ]

    if len(primary_keys) != 1:
        raise RuntimeError(
            f"{model.__name__} must have exactly one mapped primary key."
        )

    return getattr(model, primary_keys[0].key)


def _serialize(record: DeclarativeBase) -> dict[str, Any]:
    values = {
        attribute.key: getattr(record, attribute.key)
        for attribute in record.__mapper__.column_attrs
    }
    return jsonable_encoder(values)


@router.get("/{module}/resources")
def list_resources(module: str) -> list[dict[str, Any]]:
    module_resources = RESOURCE_MODELS.get(module)

    if module_resources is None:
        raise HTTPException(
            status_code=404,
            detail="Administrator module not found.",
        )

    return [
        {
            "key": resource_key,
            "label": label,
            "fields": _model_fields(model),
        }
        for resource_key, (label, model) in module_resources.items()
    ]


@router.get("/{module}/{resource_key}")
def list_records(
    module: str,
    resource_key: str,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    _, model = _resource(module, resource_key)

    return [
        _serialize(record)
        for record in db.query(model).order_by(_primary_key(model)).all()
    ]


@router.get("/{module}/{resource_key}/{record_id}")
def get_record(
    module: str,
    resource_key: str,
    record_id: int,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    _, model = _resource(module, resource_key)
    record = db.get(model, record_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Record not found.")

    return _serialize(record)


@router.patch("/{module}/{resource_key}/{record_id}")
def update_record(
    module: str,
    resource_key: str,
    record_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    _, model = _resource(module, resource_key)
    record = db.get(model, record_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Record not found.")

    values = _update_schema(model).model_validate(payload).model_dump(
        exclude_unset=True
    )

    for field, value in values.items():
        setattr(record, field, value)

    try:
        db.commit()
        db.refresh(record)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The record conflicts with existing data or references.",
        ) from exc

    return _serialize(record)


@router.delete(
    "/{module}/{resource_key}/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_record(
    module: str,
    resource_key: str,
    record_id: int,
    db: Session = Depends(get_db),
) -> Response:
    _, model = _resource(module, resource_key)
    record = db.get(model, record_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Record not found.")

    db.delete(record)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "The record cannot be deleted while other records "
                "reference it."
            ),
        ) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)