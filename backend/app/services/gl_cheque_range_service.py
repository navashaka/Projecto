from sqlalchemy.orm import Session

from app.models.gl_cheque_range import GLChequeRange
from app.repositories.gl_cheque_range_repository import (
    create_gl_cheque_range,
    get_gl_cheque_ranges,
    get_gl_cheque_range_by_id,
    update_gl_cheque_range,
    delete_gl_cheque_range,
)
from app.schemas.gl_cheque_range import GLChequeRangeCreate


def create_cheque_range(
    db: Session,
    data: GLChequeRangeCreate,
) -> GLChequeRange:
    cheque_range = GLChequeRange(
        bank_account_id=data.bank_account_id,
        from_number=data.from_number,
        to_number=data.to_number,
        cheque_image=data.cheque_image,
        default_company_name=data.default_company_name,
    )

    return create_gl_cheque_range(db, cheque_range)


def get_all_cheque_ranges(
    db: Session,
) -> list[GLChequeRange]:
    return get_gl_cheque_ranges(db)


def get_cheque_range(
    db: Session,
    cheque_range_id: int,
) -> GLChequeRange | None:
    return get_gl_cheque_range_by_id(
        db,
        cheque_range_id,
    )


def update_cheque_range(
    db: Session,
    cheque_range_id: int,
    data: GLChequeRangeCreate,
) -> GLChequeRange | None:
    cheque_range = get_gl_cheque_range_by_id(
        db,
        cheque_range_id,
    )

    if cheque_range is None:
        return None

    cheque_range.bank_account_id = data.bank_account_id
    cheque_range.from_number = data.from_number
    cheque_range.to_number = data.to_number
    cheque_range.cheque_image = data.cheque_image
    cheque_range.default_company_name = data.default_company_name

    return update_gl_cheque_range(
        db,
        cheque_range,
    )


def delete_cheque_range(
    db: Session,
    cheque_range_id: int,
) -> bool:
    cheque_range = get_gl_cheque_range_by_id(
        db,
        cheque_range_id,
    )

    if cheque_range is None:
        return False

    delete_gl_cheque_range(
        db,
        cheque_range,
    )

    return True