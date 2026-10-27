from sqlalchemy.orm import Session, selectinload

from app.models.travelling_advance import TravellingAdvance


def create_travelling_advance(
    db: Session,
    data: TravellingAdvance,
):
    try:
        db.add(data)
        db.commit()
        db.refresh(data)
        return data
    except Exception:
        db.rollback()
        raise


def get_travelling_advance(
    db: Session,
    advance_id: int,
):
    return (
        db.query(TravellingAdvance)
        .options(selectinload(TravellingAdvance.budgets))
        .filter(TravellingAdvance.id == advance_id)
        .first()
    )


def get_all_travelling_advances(db: Session):
    return (
        db.query(TravellingAdvance)
        .options(selectinload(TravellingAdvance.budgets))
        .order_by(TravellingAdvance.id.desc())
        .all()
    )


def update_travelling_advance(
    db: Session,
    advance_id: int,
    payload: dict,
):
    advance = get_travelling_advance(db, advance_id)
    if not advance:
        return None

    try:
        budget_items = payload.pop("budget_items", None)

        for field, value in payload.items():
            setattr(advance, field, value)

        if budget_items is not None:
            advance.budgets.clear()

            from app.models.travelling_advance import TravellingAdvanceBudget

            for item in budget_items:
                advance.budgets.append(
                    TravellingAdvanceBudget(
                        budget_type=item["type"],
                        amount=item["amount"],
                    )
                )

        db.commit()
        db.refresh(advance)
        return advance
    except Exception:
        db.rollback()
        raise


def delete_travelling_advance(
    db: Session,
    advance_id: int,
) -> bool:
    advance = get_travelling_advance(db, advance_id)
    if not advance:
        return False

    try:
        db.delete(advance)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise