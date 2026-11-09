"""Purchase request and response schemas."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PurchaseFormWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payload: dict[str, Any] = Field(min_length=1)


class PurchaseFormRead(BaseModel):
    id: int
    form_type: str
    payload: dict[str, Any]
