from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.gl_tax_type import GLTaxType


router = APIRouter(
    prefix="/gl-tax-types",
    tags=["GL Tax Types"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class GLTaxTypeCreate(BaseModel):
    name: str
    rate: Decimal
    effective_date: date
    gl_account_id: int | None = None


class GLTaxTypeResponse(BaseModel):
    id: int
    name: str
    rate: Decimal
    effective_date: date
    gl_account_id: int | None
    is_active: bool

    class Config:
        from_attributes = True


@router.post(
    "/",
    response_model=GLTaxTypeResponse,
)
def create_gl_tax_type(
    data: GLTaxTypeCreate,
    db: Session = Depends(get_db),
):
    tax_type = GLTaxType(
        name=data.name,
        rate=data.rate,
        effective_date=data.effective_date,
        gl_account_id=data.gl_account_id,
    )

    db.add(tax_type)
    db.commit()
    db.refresh(tax_type)

    return tax_type


@router.get(
    "/",
    response_model=list[GLTaxTypeResponse],
)
def get_gl_tax_types(
    db: Session = Depends(get_db),
):
    return db.query(GLTaxType).all()


@router.get(
    "/{tax_type_id}",
    response_model=GLTaxTypeResponse,
)
def get_gl_tax_type(
    tax_type_id: int,
    db: Session = Depends(get_db),
):
    tax_type = (
        db.query(GLTaxType)
        .filter(GLTaxType.id == tax_type_id)
        .first()
    )

    if tax_type is None:
        raise HTTPException(
            status_code=404,
            detail="GL Tax Type not found",
        )

    return tax_type


@router.put(
    "/{tax_type_id}",
    response_model=GLTaxTypeResponse,
)
def update_gl_tax_type(
    tax_type_id: int,
    data: GLTaxTypeCreate,
    db: Session = Depends(get_db),
):
    tax_type = (
        db.query(GLTaxType)
        .filter(GLTaxType.id == tax_type_id)
        .first()
    )

    if tax_type is None:
        raise HTTPException(
            status_code=404,
            detail="GL Tax Type not found",
        )

    tax_type.name = data.name
    tax_type.rate = data.rate
    tax_type.effective_date = data.effective_date
    tax_type.gl_account_id = data.gl_account_id

    db.commit()
    db.refresh(tax_type)

    return tax_type


@router.delete(
    "/{tax_type_id}",
)
def delete_gl_tax_type(
    tax_type_id: int,
    db: Session = Depends(get_db),
):
    tax_type = (
        db.query(GLTaxType)
        .filter(GLTaxType.id == tax_type_id)
        .first()
    )

    if tax_type is None:
        raise HTTPException(
            status_code=404,
            detail="GL Tax Type not found",
        )

    db.delete(tax_type)
    db.commit()

    return {
        "message": "GL Tax Type deleted successfully"
    }