from sqlalchemy.orm import Session

from app.models.paysheet import Paysheet
from app.schemas.paysheet import PaysheetCreate, PaysheetUpdate


def create_paysheet(
    db: Session,
    data: PaysheetCreate,
):
    record = Paysheet(**data.model_dump())

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_paysheet(
    db: Session,
    paysheet_id: int,
):
    return (
        db.query(Paysheet)
        .filter(Paysheet.id == paysheet_id)
        .first()
    )


def list_paysheets(
    db: Session,
    user_id: int | None = None,
    salary_month=None,
):
    query = db.query(Paysheet)

    if user_id is not None:
        query = query.filter(
            Paysheet.user_id == user_id
        )

    if salary_month is not None:
        query = query.filter(
            Paysheet.salary_month == salary_month
        )

    return query.order_by(
        Paysheet.id.desc()
    ).all()


def update_paysheet(
    db: Session,
    paysheet_id: int,
    data: PaysheetUpdate,
):
    record = get_paysheet(db, paysheet_id)

    if not record:
        return None

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)

    return record


def delete_paysheet(
    db: Session,
    paysheet_id: int,
):
    record = get_paysheet(db, paysheet_id)

    if not record:
        return False

    db.delete(record)
    db.commit()

    return True