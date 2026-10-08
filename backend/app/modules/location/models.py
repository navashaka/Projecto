from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base


class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True)
    country = Column(String(150), nullable=False, unique=True)
    abbreviation = Column(String(10))
    capital_city = Column(String(150))
    continent = Column(String(100))
    currency = Column(String(150))
    currency_code = Column(String(10))
    region = Column(String(50))


class Pincode(Base):
    __tablename__ = "pincodes"

    id = Column(Integer, primary_key=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    circle_name = Column(String(150))
    region_name = Column(String(150))
    division_name = Column(String(150))
    office_name = Column(String(200))
    pincode = Column(String(10), nullable=False)
    office_type = Column(String(50))
    delivery = Column(String(50))
    district = Column(String(150))
    state_name = Column(String(150))
    latitude = Column(String(50))
    longitude = Column(String(50))