from pydantic import BaseModel


class CountryResponse(BaseModel):
    id: int
    country: str
    abbreviation: str | None = None
    capital_city: str | None = None
    continent: str | None = None
    currency: str | None = None
    currency_code: str | None = None
    region: str | None = None


class PincodeResponse(BaseModel):
    id: int
    country_id: int
    circle_name: str | None = None
    region_name: str | None = None
    division_name: str | None = None
    office_name: str | None = None
    pincode: str
    office_type: str | None = None
    delivery: str | None = None
    district: str | None = None
    state_name: str | None = None
    latitude: str | None = None
    longitude: str | None = None