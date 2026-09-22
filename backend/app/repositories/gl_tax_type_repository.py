from sqlalchemy.orm import Session

from app.models.gl_tax_type import GLTaxType
from app.schemas.gl_tax_type import GLTaxTypeCreate, GLTaxTypeUpdate


def create_gl_tax_type(
    db: Session,
    tax_type_data: GLTaxTypeCreate
):
    tax_type = GLTaxType(
        **tax_type_data.model_dump()
    )

    db.add(tax_type)
    db.commit()
    db.refresh(tax_type)

    return tax_type


def get_gl_tax_types(db: Session):
    return db.query(GLTaxType).all()


def get_gl_tax_type_by_id(
    db: Session,
    tax_type_id: int
):
    return (
        db.query(GLTaxType)
        .filter(GLTaxType.id == tax_type_id)
        .first()
    )


def update_gl_tax_type(
    db: Session,
    tax_type: GLTaxType,
    tax_type_data: GLTaxTypeUpdate
):
    update_data = tax_type_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(tax_type, key, value)

    db.commit()
    db.refresh(tax_type)

    return tax_type


def delete_gl_tax_type(
    db: Session,
    tax_type: GLTaxType
):
    db.delete(tax_type)
    db.commit()