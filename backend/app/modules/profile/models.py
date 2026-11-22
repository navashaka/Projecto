from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Identity,
    String,
    text,
)

from app.core.database import Base


class Profile(Base):
    __tablename__ = "profile"

    id = Column(BigInteger, Identity(always=True), primary_key=True)

    # Organization Details
    name_of_organization = Column(String(255), nullable=False)
    cin_firm_registration = Column(String(100), nullable=True)
    pan = Column(String(20), nullable=True)
    gst_registration_corporate_office = Column(String(20), nullable=True)

    # Corporate / Registered Office Address
    door_house_flat_survey_floor_no = Column(String(255), nullable=True)
    building_name = Column(String(255), nullable=True)
    landmark = Column(String(255), nullable=True)
    street_name_road_no = Column(String(255), nullable=True)
    area_colony = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pin_code = Column(String(10), nullable=True)
    country = Column(String(100), nullable=True)

    # Bank & Account Details
    type_of_account = Column(String(20), nullable=True)
    gl_account = Column(String(255), nullable=True)
    primary_bank_account_no = Column(String(50), nullable=True)
    primary_ifsc = Column(String(20), nullable=True)
    secondary_bank_account_no = Column(String(50), nullable=True)
    secondary_ifsc = Column(String(20), nullable=True)
    primary_currency = Column(String(10), nullable=False, server_default=text("'INR'"))

    # Business Details
    type_of_business = Column(String(30), nullable=True)

    # Audit Fields
    created_at = Column(
        DateTime(timezone=False),
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_at = Column(
        DateTime(timezone=False),
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )