from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class ProductionInputItemCreate(BaseModel):
    input_item_name: str


class ProductionCreate(BaseModel):
    output_product_name: str
    uom: str | None = None
    hsn: str | None = None
    cost_element: str | None = None
    input_items: list[ProductionInputItemCreate] = []


class ProductionUpdate(BaseModel):
    output_product_name: str | None = None
    uom: str | None = None
    hsn: str | None = None
    cost_element: str | None = None


class ProductionInputItemRead(BaseModel):
    id: int
    input_item_name: str

    model_config = ConfigDict(from_attributes=True)


class ProductionRead(BaseModel):
    id: int
    output_product_name: str
    uom: str | None = None
    hsn: str | None = None
    cost_element: str | None = None
    input_items: list[ProductionInputItemRead] = []

    model_config = ConfigDict(from_attributes=True)


class ProductionConsumptionCreate(BaseModel):
    input_item_name: str
    qty_consumed: Decimal = Field(ge=0)


class ProductionEntryCreate(BaseModel):
    production_id: int
    production_date: date
    shift_a: Decimal = Field(default=0, ge=0)
    shift_b: Decimal = Field(default=0, ge=0)
    shift_c: Decimal = Field(default=0, ge=0)
    consumption: list[ProductionConsumptionCreate] = []


class ProductionConsumptionRead(BaseModel):
    id: int
    input_item_name: str
    qty_consumed: Decimal

    model_config = ConfigDict(from_attributes=True)


class ProductionEntryRead(BaseModel):
    id: int
    production_id: int
    production_date: date
    shift_a: Decimal
    shift_b: Decimal
    shift_c: Decimal
    total_qty: Decimal
    consumption: list[ProductionConsumptionRead] = []

    model_config = ConfigDict(from_attributes=True)