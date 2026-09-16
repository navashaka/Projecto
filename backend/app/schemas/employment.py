from datetime import date
from pydantic import BaseModel


class EmploymentCreate(BaseModel):
    user_id: int

    employee_code: str | None = None
    designation: str | None = None
    department: str | None = None
    immediate_reporting_head: str | None = None
    department_head: str | None = None
    location: str | None = None

    epf_uan: str | None = None
    esi: str | None = None

    health_insurance: str | None = None
    health_insurance_date: date | None = None

    work_email: str | None = None

    bank_account_name: str | None = None
    account_no: str | None = None
    bank: str | None = None
    branch: str | None = None
    ifsc: str | None = None


class EmploymentUpdate(BaseModel):
    user_id: int
    employee_code: str | None = None
    designation: str | None = None
    department: str | None = None
    immediate_reporting_head: str | None = None
    department_head: str | None = None
    location: str | None = None
    epf_uan: str | None = None
    esi: str | None = None
    health_insurance: str | None = None
    health_insurance_date: date | None = None
    work_email: str | None = None
    bank_account_name: str | None = None
    account_no: str | None = None
    bank: str | None = None
    branch: str | None = None
    ifsc: str | None = None