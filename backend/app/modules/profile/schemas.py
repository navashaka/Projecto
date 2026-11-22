from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ProfileCreate(ProfileSchema):
    name_of_organization: str = Field(min_length=1, max_length=255)
    cin_firm_registration: str | None = None
    pan: str | None = None
    gst_registration_corporate_office: str | None = None

    door_house_flat_survey_floor_no: str | None = None
    building_name: str | None = None
    landmark: str | None = None
    street_name_road_no: str | None = None
    area_colony: str | None = None
    city: str | None = None
    state: str | None = None
    pin_code: str | None = None
    country: str | None = None

    type_of_account: str | None = None
    gl_account: str | None = None
    primary_bank_account_no: str | None = None
    primary_ifsc: str | None = None
    secondary_bank_account_no: str | None = None
    secondary_ifsc: str | None = None
    primary_currency: str = "INR"

    type_of_business: str | None = None


class ProfileUpdate(ProfileSchema):
    name_of_organization: str | None = Field(default=None, max_length=255)
    cin_firm_registration: str | None = None
    pan: str | None = None
    gst_registration_corporate_office: str | None = None

    door_house_flat_survey_floor_no: str | None = None
    building_name: str | None = None
    landmark: str | None = None
    street_name_road_no: str | None = None
    area_colony: str | None = None
    city: str | None = None
    state: str | None = None
    pin_code: str | None = None
    country: str | None = None

    type_of_account: str | None = None
    gl_account: str | None = None
    primary_bank_account_no: str | None = None
    primary_ifsc: str | None = None
    secondary_bank_account_no: str | None = None
    secondary_ifsc: str | None = None
    primary_currency: str | None = None

    type_of_business: str | None = None


class ProfileRead(ProfileCreate):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None