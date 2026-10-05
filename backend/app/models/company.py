from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Profile
    organization_name = Column(String(200), nullable=False)
    cin = Column(String(50), nullable=True)
    pan = Column(String(20), nullable=True)
    gst = Column(String(30), nullable=True)

    # Address
    address = Column(String(500), nullable=True)
    door_no = Column(String(100), nullable=True)
    building_name = Column(String(150), nullable=True)
    landmark = Column(String(150), nullable=True)
    street_name = Column(String(150), nullable=True)
    area = Column(String(150), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pin_code = Column(String(10), nullable=True)
    country = Column(String(100), nullable=True)

    # Banks & Accounts
    account_type = Column(String(20), nullable=True)
    gl_account = Column(String(150), nullable=True)
    primary_account_no = Column(String(50), nullable=True)
    primary_ifsc = Column(String(20), nullable=True)
    secondary_account_no = Column(String(50), nullable=True)
    secondary_ifsc = Column(String(20), nullable=True)
    currency = Column(String(10), nullable=True)

    # Business
    manufacturing = Column(Boolean, nullable=False, default=False)
    trading = Column(Boolean, nullable=False, default=False)
    service_provider = Column(Boolean, nullable=False, default=False)
    all_business = Column(Boolean, nullable=False, default=False)

    # Audit
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )