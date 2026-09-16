from pydantic import BaseModel


class JobProfileCreate(BaseModel):
    job_description: str | None = None


class JobProfileUpdate(BaseModel):
    job_description: str | None = None
