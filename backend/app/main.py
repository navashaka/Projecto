"""FastAPI application entry point."""

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from starlette.middleware.base import RequestResponseEndpoint
from starlette.responses import JSONResponse, Response

# Load backend/.env before importing application modules that read env vars.
BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

from app.api.deps import authenticate_admin
from app.api.v1.router import router as api_v1_router
from app.api.v1.auth import router as auth_router
from app.api.v1.admin_records import router as admin_records_router

from app.api.v1.users import router as users_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.attendance_coe import router as attendance_coe_router
from app.api.v1.company_holidays import router as company_holidays_router
from app.api.v1.paysheet import router as paysheet_router
from app.api.v1.travelling_advance import router as travelling_advance_router
from app.api.v1.salary_details import router as salary_details_router
from app.api.v1.job_profile import router as job_profile_router
from app.api.v1.on_employment import router as on_employment_router
from app.api.v1.employment import router as employment_router
from app.api.v1.travelling_expenses_reimbursement import (
    router as travelling_expenses_reimbursement_router,
)
from app.modules.purchase.router import router as purchase_router
from app.modules.hr.payroll.router import router as payroll_router
from app.modules.company.router import router as company_router
from app.modules.location.router import router as location_router
from app.modules.gl.router import router as gl_router
from app.modules.ar.router import router as ar_router

from app.api.v1.gl_tax_type import router as gl_tax_type_router
from app.api.v1.gl_group import router as gl_group_router
from app.api.v1.gl_account import router as gl_account_router
from app.api.v1.gl_bank_account import router as gl_bank_account_router
from app.api.v1.gl_cheque_range import router as gl_cheque_range_router
from app.api.v1.gl_hsn_master import router as gl_hsn_master_router
from app.api.v1.gl_sac_master import router as gl_sac_master_router
from app.api.v1.gl_od_limit import router as gl_od_limit_router

from app.api.v1.gl_account_details import (
    gl_secured_loans_router,
    gl_sundry_creditors_router,
    gl_sundry_debtors_router,
    gl_unsecured_loans_router,
)

from app.core.database import Base, engine, SessionLocal

from app.hr.recruitment.models import UserEnquiry
from app.models.attendance_coe import AttendanceCOE
from app.models.company_holiday import CompanyHoliday
from app.models.paysheet import Paysheet
from app.models.company import Company
from app.models.admin_credential import AdminCredential

from app.models.gl_tax_type import GLTaxType
from app.models.gl_group import GLGroup
from app.models.gl_account import GLAccount
from app.models.gl_bank_account import GLBankAccount
from app.models.gl_cheque_range import GLChequeRange
from app.models.gl_hsn_master import GLHSNMaster
from app.models.gl_sac_master import GLSACMaster
from app.models.gl_od_limit import GLOdLimit
from app.models.gl_account_details import (
    GLSecuredLoan,
    GLSundryCreditor,
    GLSundryDebtor,
    GLUnsecuredLoan,
)

from app.modules.inventory.router import router as inventory_router


class UserEnquiryPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    candidate_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices("candidateName", "candidate_name"),
    )
    father_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices("fatherName", "father_name"),
    )
    dob: str | None = Field(
        default=None,
        validation_alias=AliasChoices("dob", "date_of_birth"),
    )
    blood_group: str | None = Field(
        default=None,
        validation_alias=AliasChoices("bloodGroup", "blood_group"),
    )
    marital_status: str | None = Field(
        default=None,
        validation_alias=AliasChoices("maritalStatus", "marital_status"),
    )
    religion: str | None = None
    nationality: str | None = None
    mother_tongue: str | None = Field(
        default=None,
        validation_alias=AliasChoices("motherTongue", "mother_tongue"),
    )
    languages_known: str | None = Field(
        default=None,
        validation_alias=AliasChoices("languagesKnown", "languages_known"),
    )
    address: str | None = None
    phone: str | None = None
    personal_email: str | None = Field(
        default=None,
        validation_alias=AliasChoices("personalEmail", "personal_email"),
    )
    pan: str | None = None
    aadhaar: str | None = Field(
        default=None,
        validation_alias=AliasChoices("aadhar", "aadhaar"),
    )
    passport_no: str | None = Field(
        default=None,
        validation_alias=AliasChoices("passportNo", "passport_no"),
    )
    emergency_phone_1: str | None = Field(
        default=None,
        validation_alias=AliasChoices("emergencyPhone1", "emergency_phone_1"),
    )
    emergency_phone_2: str | None = Field(
        default=None,
        validation_alias=AliasChoices("emergencyPhone2", "emergency_phone_2"),
    )
    highest_qualification: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "highestQualification",
            "highest_qualification",
        ),
    )
    year_of_pass: str | None = Field(
        default=None,
        validation_alias=AliasChoices("yearOfPass", "year_of_pass"),
    )
    current_employer: str | None = Field(
        default=None,
        validation_alias=AliasChoices("currentEmployer", "current_employer"),
    )
    position: str | None = None
    department: str | None = None
    working_period: str | None = Field(
        default=None,
        validation_alias=AliasChoices("workingPeriod", "working_period"),
    )
    current_ctc: str | None = Field(
        default=None,
        validation_alias=AliasChoices("currentCtc", "current_ctc"),
    )
    current_responsibilities: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "currentResponsibilities",
            "current_responsibilities",
        ),
    )
    previous_employer: str | None = Field(
        default=None,
        validation_alias=AliasChoices("previousEmployer", "previous_employer"),
    )
    previous_position: str | None = Field(
        default=None,
        validation_alias=AliasChoices("previousPosition", "previous_position"),
    )
    previous_department: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "previousDepartment",
            "previous_department",
        ),
    )
    previous_working_period: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "previousWorkingPeriod",
            "previous_working_period",
        ),
    )
    previous_ctc: str | None = Field(
        default=None,
        validation_alias=AliasChoices("previousCtc", "previous_ctc"),
    )
    previous_responsibilities: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "previousResponsibilities",
            "previous_responsibilities",
        ),
    )


app = FastAPI(title="Projecto API")


@app.exception_handler(RequestValidationError)
async def hide_passwords_from_validation_errors(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    password_fields = {
        "password",
        "current_password",
        "new_password",
        "confirm_new_password",
    }
    errors = []

    for error in exc.errors():
        sanitized = dict(error)
        if any(
            str(part).lower() in password_fields
            for part in error.get("loc", ())
        ):
            sanitized.pop("input", None)
            sanitized.pop("ctx", None)
        errors.append(sanitized)

    return JSONResponse(
        status_code=422,
        content=jsonable_encoder({"detail": errors}),
    )


ADMIN_MUTATION_PREFIXES = (
    "/api/v1/user-enquiries",
    "/attendance",
    "/attendance-coe",
    "/company-holidays",
    "/employment",
    "/job-profile",
    "/on-employment",
    "/paysheet",
    "/salary-details",
    "/travelling-advance",
    "/travelling-expenses-reimbursement",
    "/gl-",
    "/inventory/",
)


@app.middleware("http")
async def protect_record_management(
    request: Request,
    call_next: RequestResponseEndpoint,
) -> Response:
    if request.method in {"PUT", "PATCH", "DELETE"} and any(
        request.url.path == prefix.rstrip("/")
        or request.url.path.startswith(prefix)
        for prefix in ADMIN_MUTATION_PREFIXES
    ):
        db = SessionLocal()
        try:
            authenticate_admin(request.headers.get("authorization"), db)
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=exc.headers,
            )
        finally:
            db.close()

    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(users_router)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_records_router, prefix="/api/v1")
app.include_router(attendance_router)
app.include_router(attendance_coe_router)
app.include_router(company_holidays_router)
app.include_router(paysheet_router)
app.include_router(travelling_advance_router)
app.include_router(salary_details_router)
app.include_router(job_profile_router)
app.include_router(on_employment_router)
app.include_router(employment_router,prefix="/api/v1")
app.include_router(travelling_expenses_reimbursement_router)

app.include_router(payroll_router)
app.include_router(company_router)
app.include_router(location_router)

# General Ledger module and existing GL APIs
app.include_router(gl_router)
app.include_router(gl_tax_type_router)
app.include_router(gl_group_router)
app.include_router(gl_account_router)
app.include_router(gl_bank_account_router)
app.include_router(gl_cheque_range_router)
app.include_router(gl_hsn_master_router)
app.include_router(gl_sac_master_router)
app.include_router(gl_od_limit_router)
app.include_router(gl_sundry_creditors_router)
app.include_router(gl_sundry_debtors_router)
app.include_router(gl_secured_loans_router)
app.include_router(gl_unsecured_loans_router)

# Inventory module
app.include_router(inventory_router)

# Accounts Receivable module
app.include_router(ar_router)

app.include_router(purchase_router)

# API v1 routes
app.include_router(api_v1_router, prefix="/api/v1")


@app.post("/api/enquiries")
def receive_user_enquiry(
    payload: UserEnquiryPayload,
) -> dict[str, Any]:
    return {
        "message": "Enquiry received successfully",
        "data": payload.model_dump(by_alias=True),
    }