from pydantic import BaseModel


class GLChequeRangeCreate(BaseModel):
    bank_account_id: int
    from_number: str
    to_number: str
    cheque_image: str | None = None
    default_company_name: str | None = None


class GLChequeRangeResponse(BaseModel):
    id: int
    bank_account_id: int
    from_number: str
    to_number: str
    cheque_image: str | None
    default_company_name: str | None

    class Config:
        from_attributes = True