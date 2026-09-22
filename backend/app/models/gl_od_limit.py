from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class GLOdLimit(Base):
    __tablename__ = "gl_od_limits"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    bank_account_id: Mapped[int] = mapped_column(
        ForeignKey("gl_bank_accounts.id"),
        nullable=False,
    )

    od_limit: Mapped[float | None] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )

    rate_of_interest: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    effective_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )