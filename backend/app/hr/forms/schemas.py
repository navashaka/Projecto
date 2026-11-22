from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class HRFormRecordCreate(BaseModel):
    payload: dict[str, Any] = Field(min_length=1)


class HRFormRecordUpdate(BaseModel):
    payload: dict[str, Any] = Field(min_length=1)


class HRFormRecordRead(BaseModel):
    id: int
    form_type: str
    payload: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
