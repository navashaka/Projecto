from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.travelling_advance import (
    TravellingAdvance,
    TravellingAdvanceBudget,
)
from app.schemas.travelling_advance import (
    TravellingAdvanceCreate,
    TravellingAdvanceUpdate,
)
from app.repositories.travelling_advance_repository import (
    create_travelling_advance,
    delete_travelling_advance,
    get_all_travelling_advances,
    get_travelling_advance,
    update_travelling_advance,
)


def create_travelling_advance_service(
    db: Session,
    data: TravellingAdvanceCreate,
):
    payload = data.model_dump(
        exclude={"budget_items", "place_to_be_visited"}
    )
    budget_items = data.budget_items

    # Keep the required field name and map it to the model column.
    payload["place_to_be_visited"] = (
        data.place_to_be_visited or data.place_visited
    )

    # Calculate total from budget items and other expense only once.
    budget_total = sum(
        (item.amount for item in budget_items),
        Decimal("0"),
    )
    other_expense = payload.get("other_expense_amount") or Decimal("0")
    payload["total_advance"] = budget_total + other_expense

    advance = TravellingAdvance(**payload)

    for item in budget_items:
        advance.budgets.append(
            TravellingAdvanceBudget(
                budget_type=item.type,
                amount=item.amount,
            )
        )

    return create_travelling_advance(db, advance)


def get_travelling_advance_service(
    db: Session,
    advance_id: int,
):
    return get_travelling_advance(db, advance_id)


def list_travelling_advances_service(db: Session):
    return get_all_travelling_advances(db)


def update_travelling_advance_service(
    db: Session,
    advance_id: int,
    data: TravellingAdvanceUpdate,
):
    payload = data.model_dump(exclude_unset=True)

    budget_items = payload.pop("budget_items", None)

    if "place_to_be_visited" in payload:
        payload["place_to_be_visited"] = payload.pop(
            "place_to_be_visited"
        )

    if budget_items is not None:
        payload["budget_items"] = [
            item.model_dump() for item in budget_items
        ]

        budget_total = sum(
            (item.amount for item in budget_items),
            Decimal("0"),
        )
        other_expense = payload.get("other_expense_amount")

        if other_expense is None:
            existing = get_travelling_advance(db, advance_id)
            other_expense = (
                existing.other_expense_amount
                if existing and existing.other_expense_amount
                else Decimal("0")
            )

        payload["total_advance"] = budget_total + other_expense

    return update_travelling_advance(db, advance_id, payload)


def delete_travelling_advance_service(
    db: Session,
    advance_id: int,
) -> bool:
    return delete_travelling_advance(db, advance_id)