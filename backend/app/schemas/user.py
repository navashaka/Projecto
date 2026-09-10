
from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class UserCreate(BaseModel):
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
    emergency_phone: str | None = None
    emergency_phone2: str | None = None
    mother_tongue: str | None = None
    other_languages: str | None = None
    religion: str | None = None
    nationality: str | None = None
    highest_qualification: str | None = None
    years_of_experience: Decimal | None = None
    year_of_pass: int | None = None
    qualification_certificate: str | None = None
    current_employer: str | None = None
    position: str | None = None
    department: str | None = None
    working_period: str | None = None
    role_responsibilities_achievements: str | None = None
    current_ctc: Decimal | None = None
    employment_documents: str | None = None