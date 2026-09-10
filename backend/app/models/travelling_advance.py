from sqlalchemy import Column, BigInteger, Integer, String, Text, Date, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class TravellingAdvance(Base):
    __tablename__ = "travelling_advance"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)

    employee_code = Column(String(50))
    designation = Column(String(150))
    department = Column(String(150))

    from_date = Column(Date)
    to_date = Column(Date)

    place_visited = Column(String(200))
    purpose_of_visit = Column(Text)

    type_of_expense = Column(String(100))
    expense_amount = Column(Numeric(12, 2))

    additional_expense_type = Column(String(100))
    additional_expense_amount = Column(Numeric(12, 2))

    other_expense_type = Column(String(100))
    other_expense_amount = Column(Numeric(12, 2))

    total_advance = Column(Numeric(12, 2))

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())