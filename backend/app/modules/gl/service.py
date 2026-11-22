from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.modules.gl.models import (
    ContraEntry,
    CostElement,
    CreditNote,
    CreditNoteAccount,
    CreditNoteItem,
    DebitNote,
    DebitNoteAccount,
    DebitNoteItem,
    JournalEntry,
    JournalEntryItem,
)

CENT = Decimal("0.01")


def _money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def _http_database_error(error: Exception) -> HTTPException:
    if isinstance(error, IntegrityError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="GL record violates a database constraint",
        )
    if isinstance(error, SQLAlchemyError):
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GL database operation failed",
        )
    if isinstance(error, ValueError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
    raise error


def _account_rows(db: Session) -> tuple[list[dict[str, Any]], set[int]]:
    from sqlalchemy import text

    groups = {
        int(row["id"]): {
            "name": row["name"],
            "parent_group_id": row["parent_group_id"],
        }
        for row in db.execute(
            text("SELECT id, name, parent_group_id FROM gl_groups")
        ).mappings()
    }
    accounts = []
    for row in db.execute(
        text(
            """
            SELECT a.id, a.name, a.group_id, a.costing_applicable, a.is_active
            FROM gl_accounts AS a
            WHERE a.is_active IS TRUE
            ORDER BY a.name
            """
        )
    ).mappings():
        group_id = int(row["group_id"])
        path: list[str] = []
        seen: set[int] = set()
        while group_id in groups and group_id not in seen:
            seen.add(group_id)
            group = groups[group_id]
            path.append(str(group["name"]))
            parent_id = group["parent_group_id"]
            if parent_id is None:
                break
            group_id = int(parent_id)
        accounts.append({**dict(row), "path": " / ".join(reversed(path))})
    income_expense_ids = {
        int(row["id"])
        for row in accounts
        if any(
            term in str(row["path"]).lower()
            for term in ("income", "expense", "revenue")
        )
    }
    return accounts, income_expense_ids


def list_bank_cash_accounts(db: Session) -> list[dict[str, str]]:
    from sqlalchemy import text

    banks = db.execute(
        text(
            """
            SELECT id, account_number, bank_name
            FROM gl_bank_accounts
            ORDER BY bank_name, account_number
            """
        )
    ).mappings().all()
    accounts, _ = _account_rows(db)
    rows = [
        {
            "id": f"bank:{row['id']}",
            "label": f"{row['bank_name']} - {row['account_number']}",
        }
        for row in banks
    ]
    rows.extend(
        {
            "id": f"cash:{row['id']}",
            "label": str(row["name"]),
        }
        for row in accounts
        if any(
            term in str(row["path"]).lower()
            for term in ("cash", "bank")
        )
    )
    return rows


def list_gl_accounts(db: Session) -> list[dict[str, Any]]:
    accounts, income_expense_ids = _account_rows(db)
    return [
        {
            "id": row["id"],
            "label": row["name"],
            "requires_cost_element": int(row["id"]) in income_expense_ids,
        }
        for row in accounts
    ]


def _validate_bank_cash_account(db: Session, value: str) -> None:
    from sqlalchemy import text

    try:
        kind, raw_id = value.split(":", maxsplit=1)
        account_id = int(raw_id)
    except (ValueError, AttributeError) as error:
        raise ValueError("Select an existing Bank/Cash account") from error

    if kind == "bank":
        exists = db.execute(
            text("SELECT 1 FROM gl_bank_accounts WHERE id = :id"),
            {"id": account_id},
        ).scalar_one_or_none()
    elif kind == "cash":
        accounts, _ = _account_rows(db)
        exists = any(
            int(row["id"]) == account_id
            and any(term in str(row["path"]).lower() for term in ("cash", "bank"))
            for row in accounts
        )
    else:
        exists = None
    if not exists:
        raise ValueError("Selected Bank/Cash account does not exist or is inactive")


def _validate_gl_account(db: Session, value: str) -> tuple[dict[str, Any], bool]:
    accounts, income_expense_ids = _account_rows(db)
    account = next((row for row in accounts if row["name"] == value), None)
    if account is None:
        raise ValueError("Select an existing active GL account")
    return account, int(account["id"]) in income_expense_ids


def _validate_cost_element(db: Session, value: str | None, required: bool) -> None:
    if not value:
        if required:
            raise ValueError("Select a Cost Element for this Income/Expense GL Account")
        return
    element = db.execute(
        select(CostElement.id).where(
            CostElement.name == value,
            CostElement.is_active.is_(True),
        )
    ).scalar_one_or_none()
    if element is None:
        raise ValueError("Select an existing active Cost Element")


def _validate_contra(db: Session, values: dict[str, Any]) -> None:
    first = values["bank_cash_account_1"]
    second = values["bank_cash_account_2"]
    if first == second:
        raise ValueError("Select two different Bank/Cash accounts")
    _validate_bank_cash_account(db, first)
    _validate_bank_cash_account(db, second)
    if values["debit_amount"] != values["credit_amount"]:
        raise ValueError("Contra debit and credit amounts must be equal")
    if values["total"] != values["debit_amount"]:
        raise ValueError("Total must equal the balanced debit and credit amount")


def _validate_journal_items(
    db: Session,
    items: list[dict[str, Any]],
    total: Decimal,
) -> None:
    if len(items) < 2:
        raise ValueError("A journal entry must contain at least two rows")
    debits = Decimal("0")
    credits = Decimal("0")
    for item in items:
        debit = item["debit_amount"]
        credit = item["credit_amount"]
        if (debit > 0) == (credit > 0):
            raise ValueError("Each journal row must have either a debit or a credit amount")
        _, requires_cost_element = _validate_gl_account(db, item["gl_account"])
        _validate_cost_element(db, item.get("cost_element"), requires_cost_element)
        debits += debit
        credits += credit
    if debits <= 0 or debits != credits:
        raise ValueError("Journal debit and credit totals must be equal and greater than zero")
    if total != debits:
        raise ValueError("Journal Total must equal the debit (and credit) total")


def _table_rows(model, parent_key: str, parent_id: int, db: Session) -> list[dict[str, Any]]:
    rows = db.execute(
        select(model).where(getattr(model, parent_key) == parent_id).order_by(model.id)
    ).scalars().all()
    return [
        {
            column.name: getattr(row, column.name)
            for column in model.__table__.columns
            if column.name not in ("id", parent_key)
        }
        for row in rows
    ]


def _validate_note_lines(db: Session, values: dict[str, Any]) -> None:
    inventory_related = values["inventory_related"]
    lines = values["items"] if inventory_related else values["accounts"]
    ignored_lines = values["accounts"] if inventory_related else values["items"]
    if ignored_lines:
        raise ValueError("Provide only the lines matching Inventory Related")
    if not lines:
        raise ValueError("At least one note detail row is required")

    from sqlalchemy import text

    total = Decimal("0")
    for line in lines:
        amount = line["amount"]
        gst = line["gst"]
        expected_line_total = _money(amount + gst)
        if _money(line["total_amount"]) != expected_line_total:
            raise ValueError("Each line total must equal Amount plus GST")
        if inventory_related:
            qty_rate_amount = _money(line["qty"] * line["rate"])
            if abs(qty_rate_amount - _money(amount)) > CENT:
                raise ValueError("Inventory line Amount must equal Qty multiplied by Rate")
            item_exists = db.execute(
                text("SELECT 1 FROM inventory_stock_items WHERE name = :name"),
                {"name": line["item"]},
            ).scalar_one_or_none()
            hsn_exists = db.execute(
                text("SELECT 1 FROM gl_hsn_master WHERE hsn_code = :hsn AND is_active IS TRUE"),
                {"hsn": line["hsn"]},
            ).scalar_one_or_none()
            if not item_exists:
                raise ValueError("Select an existing inventory Item")
            if not hsn_exists:
                raise ValueError("Select an existing active HSN code")
        else:
            _validate_gl_account(db, line["gl_account"])
        total += expected_line_total
    if _money(total) != _money(values["total"]):
        raise ValueError("Note Total must equal the sum of its detail line totals")


def _read_note(
    record,
    item_model,
    account_model,
    parent_key: str,
    db: Session,
) -> dict[str, Any]:
    header = {
        column.name: getattr(record, column.name)
        for column in record.__table__.columns
    }
    header["items"] = _table_rows(item_model, parent_key, record.id, db)
    header["accounts"] = _table_rows(account_model, parent_key, record.id, db)
    return header


def _create_note(db: Session, model, item_model, account_model, values: dict[str, Any]):
    _validate_note_lines(db, values)
    items = values.pop("items", [])
    accounts = values.pop("accounts", [])
    record = model(**values)
    db.add(record)
    db.flush()
    child_model = item_model if record.inventory_related else account_model
    parent_key = "credit_note_id" if record.__tablename__ == "gl_credit_notes" else "debit_note_id"
    child_values = items if record.inventory_related else accounts
    for line in child_values:
        db.add(child_model(**{**line, parent_key: record.id}))
    db.commit()
    db.refresh(record)
    parent_key = "credit_note_id" if record.__tablename__ == "gl_credit_notes" else "debit_note_id"
    return _read_note(record, item_model, account_model, parent_key, db)


def _update_note(db: Session, record, item_model, account_model, values: dict[str, Any]):
    merged = {
        key: getattr(record, key)
        for key in ("inventory_related", "total")
    }
    merged.update({key: value for key, value in values.items() if key not in ("items", "accounts")})
    supplied_lines = "items" in values or "accounts" in values
    merged["items"] = values.get("items", _table_rows(
        item_model,
        "credit_note_id" if record.__tablename__ == "gl_credit_notes" else "debit_note_id",
        record.id,
        db,
    ))
    merged["accounts"] = values.get("accounts", _table_rows(
        account_model,
        "credit_note_id" if record.__tablename__ == "gl_credit_notes" else "debit_note_id",
        record.id,
        db,
    ))
    _validate_note_lines(db, merged)
    values = {key: value for key, value in values.items() if key not in ("items", "accounts")}
    for key, value in values.items():
        setattr(record, key, value)
    if supplied_lines:
        db.query(item_model).filter(
            getattr(item_model, "credit_note_id" if record.__tablename__ == "gl_credit_notes" else "debit_note_id") == record.id
        ).delete(synchronize_session=False)
        db.query(account_model).filter(
            getattr(account_model, "credit_note_id" if record.__tablename__ == "gl_credit_notes" else "debit_note_id") == record.id
        ).delete(synchronize_session=False)
        parent_key = "credit_note_id" if record.__tablename__ == "gl_credit_notes" else "debit_note_id"
        child_model = item_model if record.inventory_related else account_model
        child_values = merged["items"] if record.inventory_related else merged["accounts"]
        for line in child_values:
            db.add(child_model(**{**line, parent_key: record.id}))
    db.commit()
    db.refresh(record)
    parent_key = "credit_note_id" if record.__tablename__ == "gl_credit_notes" else "debit_note_id"
    return _read_note(record, item_model, account_model, parent_key, db)


def _read_journal(record, db: Session) -> dict[str, Any]:
    return {
        "id": record.id,
        "date": record.date,
        "total": record.total,
        "items": _table_rows(JournalEntryItem, "voucher_id", record.id, db),
    }


def _create_journal(db: Session, values: dict[str, Any]):
    items = values.pop("items")
    _validate_journal_items(db, items, values["total"])
    record = JournalEntry(**values)
    db.add(record)
    db.flush()
    for item in items:
        db.add(JournalEntryItem(**{**item, "voucher_id": record.id}))
    db.commit()
    db.refresh(record)
    return _read_journal(record, db)


def _update_journal(db: Session, record, values: dict[str, Any]):
    items = values.pop("items", None)
    if items is None:
        items = _table_rows(JournalEntryItem, "voucher_id", record.id, db)
    date_value = values.get("date", record.date)
    total = values.get("total", record.total)
    if date_value is None or total is None:
        raise ValueError("Journal date and total are required")
    _validate_journal_items(db, items, Decimal(total))
    for key in ("date", "total"):
        if key in values:
            setattr(record, key, values[key])
    db.query(JournalEntryItem).filter(
        JournalEntryItem.voucher_id == record.id
    ).delete(synchronize_session=False)
    for item in items:
        db.add(JournalEntryItem(**{**item, "voucher_id": record.id}))
    db.commit()
    db.refresh(record)
    return _read_journal(record, db)


def create_record(db: Session, operation):
    try:
        return operation()
    except (ValueError, IntegrityError, SQLAlchemyError) as error:
        db.rollback()
        raise _http_database_error(error) from error


def update_record(db: Session, operation):
    return create_record(db, operation)


def list_records(db: Session, model) -> list:
    return db.execute(select(model).order_by(model.id.desc())).scalars().all()


def get_record(db: Session, model, record_id: int):
    record = db.get(model, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="GL record not found")
    return record


def delete_record(db: Session, operation) -> None:
    try:
        operation()
        db.commit()
    except (IntegrityError, SQLAlchemyError) as error:
        db.rollback()
        raise _http_database_error(error) from error


def create_contra(db: Session, values: dict[str, Any]):
    _validate_contra(db, values)
    record = ContraEntry(**values)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_contra(db: Session, record: ContraEntry, values: dict[str, Any]):
    merged = {column.name: getattr(record, column.name) for column in record.__table__.columns if column.name != "id"}
    merged.update(values)
    _validate_contra(db, merged)
    for key, value in values.items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


def create_journal(db: Session, values: dict[str, Any]):
    return _create_journal(db, values)


def update_journal(db: Session, record: JournalEntry, values: dict[str, Any]):
    return _update_journal(db, record, values)


def create_credit_note(db: Session, values: dict[str, Any]):
    return _create_note(db, CreditNote, CreditNoteItem, CreditNoteAccount, values)


def update_credit_note(db: Session, record: CreditNote, values: dict[str, Any]):
    return _update_note(db, record, CreditNoteItem, CreditNoteAccount, values)


def create_debit_note(db: Session, values: dict[str, Any]):
    return _create_note(db, DebitNote, DebitNoteItem, DebitNoteAccount, values)


def update_debit_note(db: Session, record: DebitNote, values: dict[str, Any]):
    return _update_note(db, record, DebitNoteItem, DebitNoteAccount, values)


def read_credit_note(record: CreditNote, db: Session) -> dict[str, Any]:
    return _read_note(record, CreditNoteItem, CreditNoteAccount, "credit_note_id", db)


def read_debit_note(record: DebitNote, db: Session) -> dict[str, Any]:
    return _read_note(record, DebitNoteItem, DebitNoteAccount, "debit_note_id", db)


def read_journal(record: JournalEntry, db: Session) -> dict[str, Any]:
    return _read_journal(record, db)


def list_cost_elements(db: Session) -> list[CostElement]:
    return db.execute(
        select(CostElement)
        .where(CostElement.is_active.is_(True))
        .order_by(CostElement.name)
    ).scalars().all()


def create_cost_element(db: Session, name: str) -> CostElement:
    record = CostElement(name=name.strip())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_cost_element(db: Session, record: CostElement, values: dict[str, Any]) -> CostElement:
    for key, value in values.items():
        setattr(record, key, value.strip() if key == "name" else value)
    db.commit()
    db.refresh(record)
    return record


def deactivate_cost_element(db: Session, record: CostElement) -> None:
    record.is_active = False
    db.commit()
