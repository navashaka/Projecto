from pydantic import BaseModel


class GLBaseSchema(BaseModel):
    pass


class GLResponseSchema(BaseModel):
    id: int

    class Config:
        from_attributes = True