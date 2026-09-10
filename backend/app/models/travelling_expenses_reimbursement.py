from sqlalchemy import (
    Column, BigInteger, String, Text, Date, Numeric, DateTime, ForeignKey
)
from sqlalchemy.sql import func

from app.core.database import Base


class TravellingExpensesReimbursement(Base):
    __tablename__ = "travelling_expenses_reimbursement"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)

    name = Column(String(150))
    employee_code = Column(String(50))
    designation = Column(String(150))
    department = Column(String(150))

    from_date = Column(Date)
    to_date = Column(Date)

    place_visited = Column(String(200))
    purpose_of_visit = Column(Text)

    expense_type1 = Column(String(150))
    expense_amount1 = Column(Numeric(12, 2))
    attachment1 = Column(Text)

    expense_type2 = Column(String(150))
    expense_amount2 = Column(Numeric(12, 2))
    attachment2 = Column(Text)

    other_expense_type = Column(String(150))
    other_expense_amount = Column(Numeric(12, 2))
    attachment3 = Column(Text)

    total_amount = Column(Numeric(12, 2))

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())