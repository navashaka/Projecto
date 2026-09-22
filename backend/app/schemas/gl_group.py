from pydantic import BaseModel


class GLGroupCreate(BaseModel):
    name: str
    parent_group_id: int | None = None
    is_default: bool = False
    tax_applicable: bool = False
    costing_applicable: bool = False


class GLGroupResponse(BaseModel):
    id: int
    name: str
    parent_group_id: int | None
    is_default: bool
    tax_applicable: bool
    costing_applicable: bool
    is_active: bool

    class Config:
        from_attributes = True