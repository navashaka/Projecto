from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class QualificationDetail(BaseModel):
    highest_qualification: str | None = None
    year_of_pass: str | None = None
    document: str | None = None


class PreviousEmploymentDetail(BaseModel):
    employer_name: str | None = None
    position: str | None = None
    department: str | None = None
    working_from: str | None = None
    relieved_on: str | None = None
    ctc: str | None = None
    take_home: str | None = None
    responsibilities: str | None = None
    documents: str | None = None


class UserEnquiryBase(BaseModel):
    candidate_name: str = Field(min_length=1)
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
    street_number: str | None = None
    street_name: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    zip_code: str | None = None

    highest_qualification: str | None = None
    year_of_pass: str | None = None
    highest_qualification_document: str | None = None
    year_of_pass_document: str | None = None
    qualification_details: list[QualificationDetail] | None = None

    employment_type: str | None = None
    current_employer: str | None = None
    current_position: str | None = None
    department: str | None = None
    current_working_from: date | None = None
    working_period: str | None = None
    role_responsibilities: str | None = None
    current_ctc: str | None = None
    current_take_home: str | None = None
    employer_documents: str | None = None

    previous_employer_name: str | None = None
    previous_employer_position: str | None = None
    previous_employer_department: str | None = None
    previous_working_from: date | None = None
    previous_working_to: date | None = None
    previous_employer_working_period: str | None = None
    previous_employer_role: str | None = None
    previous_employer_ctc: str | None = None
    previous_take_home: str | None = None
    previous_employer_documents: str | None = None
    previous_employment_details: list[PreviousEmploymentDetail] | None = None

    is_active: bool = True


class UserEnquiryCreate(UserEnquiryBase):
    phone: str = Field(min_length=1)
    personal_email: str = Field(
        min_length=1,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    )
    pan: str = Field(min_length=1)
    aadhaar: str = Field(min_length=1)


class UserEnquiryRead(UserEnquiryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
