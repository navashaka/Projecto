from decimal import Decimal

from sqlalchemy import BigInteger, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Payroll(Base):
    __tablename__ = "hr_payroll"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    basic_salary: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    allowances: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0"),
    )

    other_income: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0"),
    )

    tds: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0"),
    )

    other_deductions: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0"),
    )

    gross_salary: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    employee_epf: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    employee_esi: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    total_deductions: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    net_salary: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )