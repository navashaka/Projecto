from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class UserEnquiryBase(BaseModel):
    candidate_name: str
    father_name: str | None = None
    date_of_birth: date | None = None
    blood_group: str | None = None
    marital_status: str | None = None
    address: str | None = None
    phone: str | None = None
    pan: str | None = None
    aadhaar: str | None = None
    passport_no: str | None = None
    personal_email: str | None = None
    emergency_phone_1: str | None = None
    emergency_phone_2: str | None = None
    mother_tongue: str | None = None
    other_languages_known: str | None = None
    religion: str | None = None
    nationality: str | None = None

    highest_qualification: str | None = None
    year_of_pass: int | None = None
    highest_qualification_document: str | None = None
    year_of_pass_document: str | None = None

    current_employer: str | None = None
    current_position: str | None = None
    department: str | None = None
    working_period: str | None = None
    role_responsibilities: str | None = None
    current_ctc: Decimal | None = None
    employer_documents: str | None = None

    previous_employer_name: str | None = None
    previous_employer_position: str | None = None
    previous_employer_department: str | None = None
    previous_employer_working_period: str | None = None
    previous_employer_role: str | None = None
    previous_employer_ctc: str | None = None
    previous_employer_documents: str | None = None

    is_active: bool = True


class UserEnquiryCreate(UserEnquiryBase):
    pass


class UserEnquiryUpdate(BaseModel):
    candidate_name: str
    father_name: str | None = None
    date_of_birth: date | None = None
    blood_group: str | None = None
    marital_status: str | None = None
    address: str | None = None
    phone: str | None = None
    pan: str | None = None
    aadhaar: str | None = None
    passport_no: str | None = None
    personal_email: str | None = None
    emergency_phone_1: str | None = None
    emergency_phone_2: str | None = None
    mother_tongue: str | None = None
    other_languages_known: str | None = None
    religion: str | None = None
    nationality: str | None = None

    highest_qualification: str | None = None
    year_of_pass: int | None = None
    highest_qualification_document: str | None = None
    year_of_pass_document: str | None = None

    current_employer: str | None = None
    current_position: str | None = None
    department: str | None = None
    working_period: str | None = None
    role_responsibilities: str | None = None
    current_ctc: Decimal | None = None
    employer_documents: str | None = None

    previous_employer_name: str | None = None
    previous_employer_position: str | None = None
    previous_employer_department: str | None = None
    previous_employer_working_period: str | None = None
    previous_employer_role: str | None = None
    previous_employer_ctc: str | None = None
    previous_employer_documents: str | None = None

    is_active: bool | None = None


class UserEnquiryRead(UserEnquiryBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)