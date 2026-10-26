from pydantic import BaseModel, ConfigDict


class JobProfileCreate(BaseModel):
    job_role: str
    job_description: str | None = None


class JobProfileUpdate(BaseModel):
    job_role: str | None = None
    job_description: str | None = None


class JobProfileResponse(BaseModel):
    id: int
    job_role: str | None = None
    job_description: str | None = None

    created_at: str | None = None
    updated_at: str | None = None

    model_config = ConfigDict(from_attributes=True)