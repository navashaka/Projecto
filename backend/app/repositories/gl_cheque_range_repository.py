from sqlalchemy.orm import Session

from app.models.gl_cheque_range import GLChequeRange


def create_gl_cheque_range(
    db: Session,
    cheque_range: GLChequeRange,
) -> GLChequeRange:
    db.add(cheque_range)
    db.commit()
    db.refresh(cheque_range)
    return cheque_range


def get_gl_cheque_ranges(
    db: Session,
) -> list[GLChequeRange]:
    return db.query(GLChequeRange).all()


def get_gl_cheque_range_by_id(
    db: Session,
    cheque_range_id: int,
) -> GLChequeRange | None:
    return (
        db.query(GLChequeRange)
        .filter(GLChequeRange.id == cheque_range_id)
        .first()
    )


def update_gl_cheque_range(
    db: Session,
    cheque_range: GLChequeRange,
) -> GLChequeRange:
    db.commit()
    db.refresh(cheque_range)
    return cheque_range


def delete_gl_cheque_range(
    db: Session,
    cheque_range: GLChequeRange,
) -> None:
    db.delete(cheque_range)
    db.commit()