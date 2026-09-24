"""FastAPI application entry point."""

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from app.api.v1.router import router as api_v1_router
from app.core.database import Base, engine
from app.hr.recruitment.models import UserEnquiry  # noqa: F401

Base.metadata.create_all(bind=engine)


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
    dob: str | None = Field(default=None, validation_alias=AliasChoices("dob", "date_of_birth"))
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
    aadhaar: str | None = Field(default=None, validation_alias=AliasChoices("aadhar", "aadhaar"))
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
        validation_alias=AliasChoices("highestQualification", "highest_qualification"),
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
        validation_alias=AliasChoices("currentResponsibilities", "current_responsibilities"),
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
        validation_alias=AliasChoices("previousDepartment", "previous_department"),
    )
    previous_working_period: str | None = Field(
        default=None,
        validation_alias=AliasChoices("previousWorkingPeriod", "previous_working_period"),
    )
    previous_ctc: str | None = Field(
        default=None,
        validation_alias=AliasChoices("previousCtc", "previous_ctc"),
    )
    previous_responsibilities: str | None = Field(
        default=None,
        validation_alias=AliasChoices("previousResponsibilities", "previous_responsibilities"),
    )


app = FastAPI(title="Projecto API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.post("/api/enquiries")
def receive_user_enquiry(payload: UserEnquiryPayload) -> dict[str, Any]:
    """Receive candidate enquiry payload from the frontend."""
    return {
        "message": "Enquiry received successfully",
        "data": payload.model_dump(by_alias=True),
    }


app.include_router(api_v1_router, prefix="/api/v1")
