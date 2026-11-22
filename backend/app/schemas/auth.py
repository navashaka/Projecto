"""Authentication request and response schemas."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

UserRole = Literal["admin", "customer", "employee"]


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    name: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=1, max_length=256)
    role: UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: str
    name: str
    role: UserRole
