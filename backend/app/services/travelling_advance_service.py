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
    payload = data.model_dump()
    budget_items = payload.pop("budget_items", [])

    if budget_items:
        first = budget_items[0]
        second = budget_items[1] if len(budget_items) > 1 else None

        payload["type_of_expense"] = first["type"]
        payload["expense_amount"] = first["amount"]

        payload["additional_expense_type"] = (
            second["type"] if second else None
        )
        payload["additional_expense_amount"] = (
            second["amount"] if second else Decimal("0")
        )

        extra_items = budget_items[2:]
        if extra_items:
            extra_total = sum(
                (item["amount"] for item in extra_items),
                Decimal("0"),
            )
            existing_other = payload.get("other_expense_amount") or Decimal("0")
            payload["other_expense_amount"] = existing_other + extra_total
            payload["other_expense_type"] = ", ".join(
                item["type"] for item in extra_items
            )

    advance = TravellingAdvance(**payload)

    for item in budget_items:
        advance.budgets.append(
            TravellingAdvanceBudget(
                budget_type=item["type"],
                amount=item["amount"],
            )
        )

    return create_travelling_advance(db, advance)


def get_travelling_advance_service(db: Session, advance_id: int):
    return get_travelling_advance(db, advance_id)


def list_travelling_advances_service(db: Session):
    return get_all_travelling_advances(db)


def update_travelling_advance_service(
    db: Session,
    advance_id: int,
    data: TravellingAdvanceUpdate,
):
    payload = data.model_dump(exclude_unset=True)

    budget_items = payload.get("budget_items")
    if budget_items is not None:
        payload["budget_items"] = [
            item.model_dump() for item in budget_items
        ]

    return update_travelling_advance(db, advance_id, payload)


def delete_travelling_advance_service(
    db: Session,
    advance_id: int,
) -> bool:
    return delete_travelling_advance(db, advance_id)