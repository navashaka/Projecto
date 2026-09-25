from sqlalchemy import (
    BigInteger,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.core.database import Base


class UserEnquiry(Base):
    __tablename__ = "hr_userenquiry"

    id = Column(Integer, primary_key=True, index=True)

    candidate_name = Column(String(200), nullable=False)
    father_name = Column(String(200), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    blood_group = Column(String(20), nullable=True)
    marital_status = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String(30), nullable=True)
    pan = Column(String(30), nullable=True)
    aadhaar = Column(String(30), nullable=True)
    passport_no = Column(String(60), nullable=True)
    personal_email = Column(String(150), nullable=True)

    emergency_phone = Column(String(30), nullable=True)
    mother_tongue = Column(String(50), nullable=True)
    other_languages = Column(String(200), nullable=True)
    religion = Column(String(80), nullable=True)
    nationality = Column(String(80), nullable=True)

    highest_qualification = Column(String(200), nullable=True)

    years_of_experience = Column(
        Numeric(5, 2),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    emergency_phone2 = Column(
        String(30),
        nullable=True,
    )

    year_of_pass = Column(
        Integer,
        nullable=True,
    )

    qualification_certificate = Column(
        String(255),
        nullable=True,
    )

    current_employer = Column(
        String(200),
        nullable=True,
    )

    position = Column(
        String(200),
        nullable=True,
    )

    department = Column(
        String(200),
        nullable=True,
    )

    working_period = Column(
        String(150),
        nullable=True,
    )

    role_responsibilities_achievements = Column(
        Text,
        nullable=True,
    )

    current_ctc = Column(
        Numeric(12, 2),
        nullable=True,
    )

    employment_documents = Column(
        String(255),
        nullable=True,
    )


class PreviousEmployment(Base):
    __tablename__ = "hr_previous_employment"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True,
    )

    user_enquiry_id = Column(
        BigInteger,
        ForeignKey(
            "hr_userenquiry.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    employer = Column(
        String(200),
        nullable=True,
    )

    position = Column(
        String(200),
        nullable=True,
    )

    department = Column(
        String(200),
        nullable=True,
    )

    working_period = Column(
        String(150),
        nullable=True,
    )

    ctc = Column(
        Numeric(12, 2),
        nullable=True,
    )

    responsibilities = Column(
        Text,
        nullable=True,
    )

    documents = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=True,
    )