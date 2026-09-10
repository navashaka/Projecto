from sqlalchemy import Column, BigInteger, String, Text, Date, Numeric, Integer, DateTime
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    candidate_name = Column(String(150), nullable=False)
    father_name = Column(String(150))
    date_of_birth = Column(Date)
    blood_group = Column(String(10))
    marital_status = Column(String(30))
    address = Column(Text)
    phone = Column(String(20))
    pan = Column(String(20))
    aadhaar = Column(String(20))
    passport_no = Column(String(30))
    personal_email = Column(String(150))
    emergency_phone = Column(String(20))
    emergency_phone2 = Column(String(20))
    mother_tongue = Column(String(50))
    other_languages = Column(Text)
    religion = Column(String(50))
    nationality = Column(String(50))
    highest_qualification = Column(String(150))
    years_of_experience = Column(Numeric(5, 2))

    year_of_pass = Column(Integer)
    qualification_certificate = Column(Text)
    current_employer = Column(String(150))
    position = Column(String(150))
    department = Column(String(150))
    working_period = Column(String(100))
    role_responsibilities_achievements = Column(Text)
    current_ctc = Column(Numeric(12, 2))
    employment_documents = Column(Text)

    created_at = Column(DateTime)
    updated_at = Column(DateTime)
