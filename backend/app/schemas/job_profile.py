from pydantic import BaseModel


class JobProfileCreate(BaseModel):
    job_description: str | None = None
