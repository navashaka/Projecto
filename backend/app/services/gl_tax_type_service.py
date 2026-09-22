from sqlalchemy.orm import Session

from app.repositories.gl_tax_type_repository import (
    create_gl_tax_type,
    get_gl_tax_types,
    get_gl_tax_type_by_id,
    update_gl_tax_type,
    delete_gl_tax_type,
)
from app.schemas.gl_tax_type import (
    GLTaxTypeCreate,
    GLTaxTypeUpdate,
)


def create_tax_type(
    db: Session,
    tax_type_data: GLTaxTypeCreate
):
    return create_gl_tax_type(db, tax_type_data)


def get_tax_types(db: Session):
    return get_gl_tax_types(db)


def get_tax_type(
    db: Session,
    tax_type_id: int
):
    return get_gl_tax_type_by_id(db, tax_type_id)


def update_tax_type(
    db: Session,
    tax_type_id: int,
    tax_type_data: GLTaxTypeUpdate
):
    tax_type = get_gl_tax_type_by_id(db, tax_type_id)

    if not tax_type:
        return None

    return update_gl_tax_type(
        db,
        tax_type,
        tax_type_data
    )


def delete_tax_type(
    db: Session,
    tax_type_id: int
):
    tax_type = get_gl_tax_type_by_id(db, tax_type_id)

    if not tax_type:
        return None

    delete_gl_tax_type(db, tax_type)

    return True