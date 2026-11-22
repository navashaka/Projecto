from sqlalchemy.orm import Session, selectinload

from app.models.travelling_advance import (
    TravellingAdvance,
    TravellingAdvanceBudget,
)


def create_travelling_advance(
    db: Session,
    data: TravellingAdvance,
):
    try:
        db.add(data)
        db.commit()
        db.refresh(data)
        return get_travelling_advance(db, data.id)
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

    if advance is None:
        return None

    try:
        payload = payload.copy()
        budget_items = payload.pop("budget_items", None)

        if "place_to_be_visited" in payload:
            advance.place_to_be_visited = payload.pop(
                "place_to_be_visited"
            )

        for field, value in payload.items():
            if hasattr(advance, field):
                setattr(advance, field, value)

        if budget_items is not None:
            advance.budgets.clear()

            for item in budget_items:
                if hasattr(item, "model_dump"):
                    item = item.model_dump()

                advance.budgets.append(
                    TravellingAdvanceBudget(
                        budget_type=item["type"],
                        amount=item["amount"],
                    )
                )

        db.commit()
        return get_travelling_advance(db, advance_id)

    except Exception:
        db.rollback()
        raise


def delete_travelling_advance(
    db: Session,
    advance_id: int,
) -> bool:
    advance = get_travelling_advance(db, advance_id)

    if advance is None:
        return False

    try:
        db.delete(advance)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise