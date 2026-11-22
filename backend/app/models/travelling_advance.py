from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Text,
    Date,
    Numeric,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TravellingAdvance(Base):
    __tablename__ = "hr_travelling_advance"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    employee_code = Column(String(50), nullable=False, index=True)
    employee_name = Column(String(150))
    designation = Column(String(150))
    department = Column(String(150))

    from_date = Column(Date)
    to_date = Column(Date)

    place_visited = Column(String(200))
    purpose_of_visit = Column(Text)

    type_of_expense = Column(String(100))
    expense_amount = Column(Numeric(12, 2), default=0)

    additional_expense_type = Column(String(100))
    additional_expense_amount = Column(Numeric(12, 2), default=0)

    other_expense_type = Column(Text)
    other_expense_amount = Column(Numeric(12, 2), default=0)

    total_advance = Column(Numeric(12, 2), default=0)
    total_advance_words = Column(Text)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
    )

    budgets = relationship(
        "TravellingAdvanceBudget",
        back_populates="travelling_advance",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class TravellingAdvanceBudget(Base):
    __tablename__ = "hr_travelling_advance_budgets"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    travelling_advance_id = Column(
        BigInteger,
        ForeignKey("hr_travelling_advance.id", ondelete="CASCADE"),
        nullable=False,
    )

    budget_type = Column(String(100), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False, default=0)

    travelling_advance = relationship(
        "TravellingAdvance",
        back_populates="budgets",
    )