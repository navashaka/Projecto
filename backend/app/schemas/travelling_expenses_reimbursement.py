from datetime import date
from decimal import Decimal
from pydantic import BaseModel


class TravellingExpensesReimbursementCreate(BaseModel):
    user_id: int
    name: str | None = None
    employee_code: str | None = None
    designation: str | None = None
    department: str | None = None

    from_date: date | None = None
    to_date: date | None = None

    place_visited: str | None = None
    purpose_of_visit: str | None = None

    expense_type1: str | None = None
    expense_amount1: Decimal | None = None
    attachment1: str | None = None

    expense_type2: str | None = None
    expense_amount2: Decimal | None = None
    attachment2: str | None = None

    other_expense_type: str | None = None
    other_expense_amount: Decimal | None = None
    attachment3: str | None = None

    total_amount: Decimal | None = None


class TravellingExpensesReimbursementUpdate(BaseModel):
    user_id: int
    name: str | None = None
    employee_code: str | None = None
    designation: str | None = None
    department: str | None = None
    from_date: date | None = None
    to_date: date | None = None
    place_visited: str | None = None
    purpose_of_visit: str | None = None
    expense_type1: str | None = None
    expense_amount1: Decimal | None = None
    attachment1: str | None = None
    expense_type2: str | None = None
    expense_amount2: Decimal | None = None
    attachment2: str | None = None
    other_expense_type: str | None = None
    other_expense_amount: Decimal | None = None
    attachment3: str | None = None
    total_amount: Decimal | None = None