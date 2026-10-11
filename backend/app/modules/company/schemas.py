from pydantic import BaseModel, ConfigDict


class CompanyCreate(BaseModel):
    organization_name: str
    cin: str | None = None
    pan: str | None = None
    gst: str | None = None

    address: str | None = None
    door_no: str | None = None
    building_name: str | None = None
    landmark: str | None = None
    street_name: str | None = None
    area: str | None = None
    city: str | None = None
    state: str | None = None
    pin_code: str | None = None
    country: str | None = "India"

    account_type: str | None = None
    gl_account: str | None = None
    primary_account_no: str | None = None
    primary_ifsc: str | None = None
    secondary_account_no: str | None = None
    secondary_ifsc: str | None = None
    currency: str | None = "INR"

    manufacturing: bool = False
    trading: bool = False
    service_provider: bool = False
    all_business: bool = False


class CompanyResponse(CompanyCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)