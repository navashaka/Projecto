import math
import re
from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation
from typing import Any, Literal, NamedTuple

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.hr.forms.models import HRFormRecord
from app.hr.forms.schemas import HRFormRecordCreate, HRFormRecordRead, HRFormRecordUpdate

router = APIRouter(prefix="/hr/forms", tags=["hr-forms"])


class FieldRule(NamedTuple):
    kind: Literal["text", "number", "date", "time", "month", "email", "select"]
    required: bool = True
    options: tuple[str, ...] = ()


def _rules(
    names: str,
    *,
    optional: str = "",
    numbers: str = "",
    dates: str = "",
    times: str = "",
    months: str = "",
    emails: str = "",
    selects: dict[str, tuple[str, ...]] | None = None,
) -> dict[str, FieldRule]:
    optional_names = set(optional.split())
    number_names = set(numbers.split())
    date_names = set(dates.split())
    time_names = set(times.split())
    month_names = set(months.split())
    email_names = set(emails.split())
    select_rules = selects or {}
    result: dict[str, FieldRule] = {}
    for name in names.split():
        if name in number_names:
            kind = "number"
        elif name in date_names:
            kind = "date"
        elif name in time_names:
            kind = "time"
        elif name in month_names:
            kind = "month"
        elif name in email_names:
            kind = "email"
        elif name in select_rules:
            kind = "select"
        else:
            kind = "text"
        result[name] = FieldRule(
            kind=kind,
            required=name not in optional_names,
            options=select_rules.get(name, ()),
        )
    return result


FORM_RULES: dict[str, dict[str, FieldRule]] = {
    "bank-enquiry": _rules(
        "accountName accountNumber bank branch ifsc salaryOfferedCtc yearlyIncrement incrementYear "
        "basic allowance1 allowance2 allowance3 allowance4 allowance5 allowance6 additionalAllowanceName "
        "additionalAllowance arrears gross epf esiInsurance tds canteenDeductions advance loanEmi "
        "otherDeductionName otherDeduction totalDeductions netSalary employerEpfShare employerEsiShare "
        "employerInsurance transportAllowance canteenAllowance bonus otherContributionName otherContribution totalCtc",
        optional="yearlyIncrement incrementYear allowance1 allowance2 allowance3 allowance4 allowance5 allowance6 "
        "additionalAllowanceName additionalAllowance arrears epf esiInsurance tds canteenDeductions advance loanEmi "
        "otherDeductionName otherDeduction employerEpfShare employerEsiShare employerInsurance transportAllowance "
        "canteenAllowance bonus otherContributionName otherContribution",
        numbers="salaryOfferedCtc yearlyIncrement incrementYear basic allowance1 allowance2 allowance3 allowance4 "
        "allowance5 allowance6 additionalAllowance arrears gross epf esiInsurance tds canteenDeductions advance loanEmi "
        "otherDeduction totalDeductions netSalary employerEpfShare employerEsiShare employerInsurance transportAllowance "
        "canteenAllowance bonus otherContribution totalCtc",
    ),
    "attendance": _rules(
        "employeeCode employeeName attendanceDate checkIn checkOut status remarks",
        optional="checkIn checkOut remarks",
        dates="attendanceDate",
        times="checkIn checkOut",
        selects={"status": ("Present", "Absent", "Half day", "Work from home", "On duty")},
    ),
    "employees": _rules(
        "employeeId name dateOfBirth bloodGroup maritalStatus phone personalEmail address pan aadhaar "
        "passportNumber emergencyContact nationality highestQualification yearOfPass department designation",
        optional="bloodGroup passportNumber",
        dates="dateOfBirth",
        numbers="yearOfPass",
        emails="personalEmail",
        selects={"maritalStatus": ("Single", "Married", "Divorced", "Widowed")},
    ),
    "company-holidays": _rules(
        "holidayName holidayDate location holidayType description",
        optional="description",
        dates="holidayDate",
        selects={"holidayType": ("Public holiday", "Company holiday", "Optional holiday")},
    ),
    "salary": _rules(
        "employeeCode employeeName month salaryOfferedCtc yearlyIncrement basic allowance1 allowance2 allowance3 "
        "allowance4 allowance5 allowance6 arrears gross epf esiInsurance tds canteenDeductions advance loanEmi "
        "totalDeductions netSalary employerEpf employerEsi employerInsurance transportAllowance canteenAllowance bonus totalCtc",
        optional="yearlyIncrement allowance1 allowance2 allowance3 allowance4 allowance5 allowance6 arrears epf "
        "esiInsurance tds canteenDeductions advance loanEmi employerEpf employerEsi employerInsurance "
        "transportAllowance canteenAllowance bonus",
        numbers="salaryOfferedCtc yearlyIncrement basic allowance1 allowance2 allowance3 allowance4 allowance5 "
        "allowance6 arrears gross epf esiInsurance tds canteenDeductions advance loanEmi totalDeductions netSalary "
        "employerEpf employerEsi employerInsurance transportAllowance canteenAllowance bonus totalCtc",
        months="month",
    ),
    "designations": _rules(
        "designationCode designation department reportingHead responsibilities description",
        optional="reportingHead description",
    ),
    "payroll": _rules(
        "employeeCode employeeName payPeriod basic allowance1 allowance2 allowance3 allowance4 allowance5 allowance6 "
        "arrears grossPay epf esiInsurance tds canteenDeduction advanceDeduction loanEmi totalDeductions netPay",
        optional="allowance1 allowance2 allowance3 allowance4 allowance5 allowance6 arrears epf esiInsurance tds "
        "canteenDeduction advanceDeduction loanEmi",
        numbers="basic allowance1 allowance2 allowance3 allowance4 allowance5 allowance6 arrears grossPay epf "
        "esiInsurance tds canteenDeduction advanceDeduction loanEmi totalDeductions netPay",
        months="payPeriod",
    ),
    "leave": _rules(
        "employeeCode employeeName leaveType startDate endDate reason status",
        dates="startDate endDate",
        selects={
            "leaveType": ("Annual leave", "Sick leave", "Casual leave", "Unpaid leave", "Other"),
            "status": ("Pending", "Approved", "Rejected"),
        },
    ),
    "on-employment": _rules(
        "employeeCode designation department reportingHead departmentHead epfUan esi healthInsurance "
        "healthInsuranceDate workEmail",
        optional="epfUan esi healthInsurance healthInsuranceDate",
        dates="healthInsuranceDate",
        emails="workEmail",
    ),
}

TRAVEL_ADVANCE_FIELDS = {
    "employee_code",
    "employee_name",
    "designation",
    "department",
    "from_date",
    "to_date",
    "place_to_be_visited",
    "purpose_of_visit",
    "budget_items",
    "other_expense_type",
    "other_expense_amount",
    "total_advance",
    "total_advance_words",
}

_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validate_travel_advance(payload: dict[str, Any]) -> None:
    if set(payload) != TRAVEL_ADVANCE_FIELDS:
        raise HTTPException(
            status_code=422,
            detail="Travelling Advance payload fields do not match the form.",
        )
    for field in (
        "employee_code",
        "employee_name",
        "from_date",
        "to_date",
        "place_to_be_visited",
        "purpose_of_visit",
        "total_advance_words",
    ):
        if not isinstance(payload[field], str) or not payload[field].strip():
            raise HTTPException(status_code=422, detail=f"{field} is required.")
    for field in ("designation", "department", "other_expense_type"):
        if not isinstance(payload[field], str):
            raise HTTPException(status_code=422, detail=f"{field} must be text.")
    for field in ("from_date", "to_date"):
        try:
            date.fromisoformat(payload[field])
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"{field} must be a valid date.") from exc
    for field in ("other_expense_amount", "total_advance"):
        value = payload[field]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise HTTPException(status_code=422, detail=f"{field} must be numeric.")
        if not math.isfinite(value) or value < 0:
            raise HTTPException(status_code=422, detail=f"{field} must be a non-negative number.")
    items = payload["budget_items"]
    if not isinstance(items, list) or not items:
        raise HTTPException(status_code=422, detail="At least one budget item is required.")
    for item in items:
        if (
            not isinstance(item, dict)
            or set(item) != {"type_of_budget", "amount"}
            or not isinstance(item["type_of_budget"], str)
            or not item["type_of_budget"].strip()
            or isinstance(item["amount"], bool)
            or not isinstance(item["amount"], (int, float))
            or not math.isfinite(item["amount"])
            or item["amount"] < 0
        ):
            raise HTTPException(status_code=422, detail="Each budget item needs a type and non-negative amount.")


def _validate_payload(form_type: str, payload: dict[str, Any]) -> None:
    if form_type == "travelling-advance":
        _validate_travel_advance(payload)
        return

    rules = FORM_RULES.get(form_type)
    if rules is None:
        raise HTTPException(status_code=404, detail="HR form not found.")
    unknown = set(payload) - set(rules)
    if unknown:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown fields: {', '.join(sorted(unknown))}.",
        )
    for name, rule in rules.items():
        value = payload.get(name)
        if value is None or value == "":
            if rule.required:
                raise HTTPException(status_code=422, detail=f"{name} is required.")
            continue
        if not isinstance(value, str):
            raise HTTPException(status_code=422, detail=f"{name} must be a string value.")
        if rule.kind == "number":
            try:
                number = Decimal(value)
            except InvalidOperation as exc:
                raise HTTPException(status_code=422, detail=f"{name} must be numeric.") from exc
            if not number.is_finite():
                raise HTTPException(status_code=422, detail=f"{name} must be finite.")
        elif rule.kind == "date":
            try:
                date.fromisoformat(value)
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=f"{name} must be a valid date.") from exc
        elif rule.kind == "time":
            try:
                time.fromisoformat(value)
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=f"{name} must be a valid time.") from exc
        elif rule.kind == "month":
            try:
                datetime.strptime(value, "%Y-%m")
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=f"{name} must use YYYY-MM format.") from exc
        elif rule.kind == "email" and not _EMAIL_PATTERN.fullmatch(value):
            raise HTTPException(status_code=422, detail=f"{name} must be a valid email address.")
        elif rule.kind == "select" and value not in rule.options:
            raise HTTPException(
                status_code=422,
                detail=f"{name} must be one of: {', '.join(rule.options)}.",
            )


@router.post("/{form_type}", response_model=HRFormRecordRead, status_code=status.HTTP_201_CREATED)
def create_hr_form_record(
    form_type: str,
    body: HRFormRecordCreate,
    db: Session = Depends(get_db),
) -> HRFormRecord:
    _validate_payload(form_type, body.payload)
    record = HRFormRecord(form_type=form_type, payload=body.payload)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/employees/by-code/{employee_code}")
def get_hr_employee_by_code(employee_code: str, db: Session = Depends(get_db)) -> dict[str, str]:
    employee = (
        db.query(HRFormRecord)
        .filter(
            HRFormRecord.form_type == "employees",
            HRFormRecord.payload["employeeId"].as_string() == employee_code,
        )
        .first()
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found.")
    return {
        "employee_name": str(employee.payload.get("name", "")),
        "designation": str(employee.payload.get("designation", "")),
        "department": str(employee.payload.get("department", "")),
    }


@router.get("/{form_type}", response_model=list[HRFormRecordRead])
def list_hr_form_records(form_type: str, db: Session = Depends(get_db)) -> list[HRFormRecord]:
    if form_type != "travelling-advance" and form_type not in FORM_RULES:
        raise HTTPException(status_code=404, detail="HR form not found.")
    return (
        db.query(HRFormRecord)
        .filter(HRFormRecord.form_type == form_type)
        .order_by(HRFormRecord.id)
        .all()
    )


@router.get("/{form_type}/{record_id}", response_model=HRFormRecordRead)
def get_hr_form_record(
    form_type: str,
    record_id: int,
    db: Session = Depends(get_db),
) -> HRFormRecord:
    record = db.query(HRFormRecord).filter(
        HRFormRecord.form_type == form_type,
        HRFormRecord.id == record_id,
    ).first()
    if record is None:
        raise HTTPException(status_code=404, detail="HR form record not found.")
    return record


@router.put("/{form_type}/{record_id}", response_model=HRFormRecordRead)
def update_hr_form_record(
    form_type: str,
    record_id: int,
    body: HRFormRecordUpdate,
    db: Session = Depends(get_db),
) -> HRFormRecord:
    _validate_payload(form_type, body.payload)
    record = db.query(HRFormRecord).filter(
        HRFormRecord.form_type == form_type,
        HRFormRecord.id == record_id,
    ).first()
    if record is None:
        raise HTTPException(status_code=404, detail="HR form record not found.")
    record.payload = body.payload
    db.commit()
    db.refresh(record)
    return record
