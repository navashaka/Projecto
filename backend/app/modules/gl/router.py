from collections.abc import Callable
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.modules.gl import service
from app.modules.gl.models import (
    ContraEntry,
    CostElement,
    CreditNote,
    DebitNote,
    JournalEntry,
)
from app.modules.gl.schemas import (
    ContraEntryCreate,
    ContraEntryUpdate,
    CostElementCreate,
    CostElementUpdate,
    CreditNoteCreate,
    CreditNoteUpdate,
    DebitNoteCreate,
    DebitNoteUpdate,
    JournalEntryCreate,
    JournalEntryUpdate,
)

router = APIRouter(prefix="/gl-transactions", tags=["gl-transactions"])


def _call(operation: Callable[[], Any]) -> Any:
    try:
        return operation()
    except HTTPException:
        raise
    except IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="GL record violates a database constraint",
        ) from error
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GL database operation failed",
        ) from error
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error


@router.get("/lookups/bank-cash-accounts")
def bank_cash_accounts(db: Session = Depends(get_db)):
    return _call(lambda: service.list_bank_cash_accounts(db))


@router.get("/lookups/gl-accounts")
def gl_accounts(db: Session = Depends(get_db)):
    return _call(lambda: service.list_gl_accounts(db))


@router.get("/lookups/cost-elements")
def cost_element_options(db: Session = Depends(get_db)):
    return _call(
        lambda: [
            {"id": element.id, "label": element.name}
            for element in service.list_cost_elements(db)
        ]
    )


@router.get("/lookups/stock-items")
def stock_item_options(db: Session = Depends(get_db)):
    from sqlalchemy import text

    return _call(
        lambda: [
            {"id": row["id"], "label": row["name"]}
            for row in db.execute(
                text("SELECT id, name FROM inventory_stock_items ORDER BY name")
            ).mappings()
        ]
    )


@router.get("/lookups/hsn-codes")
def hsn_options(db: Session = Depends(get_db)):
    from sqlalchemy import text

    return _call(
        lambda: [
            {"id": row["hsn_code"], "label": row["hsn_code"]}
            for row in db.execute(
                text(
                    "SELECT hsn_code FROM gl_hsn_master "
                    "WHERE is_active IS TRUE ORDER BY hsn_code"
                )
            ).mappings()
        ]
    )


@router.get("/contra-entries")
def list_contra_entries(db: Session = Depends(get_db)):
    return _call(lambda: service.list_records(db, ContraEntry))


@router.get("/contra-entries/{record_id}")
def get_contra_entry(record_id: int, db: Session = Depends(get_db)):
    return _call(lambda: service.get_record(db, ContraEntry, record_id))


@router.post("/contra-entries", status_code=status.HTTP_201_CREATED)
def create_contra_entry(payload: ContraEntryCreate, db: Session = Depends(get_db)):
    return _call(
        lambda: service.create_record(
            db, lambda: service.create_contra(db, payload.model_dump())
        )
    )


@router.put("/contra-entries/{record_id}")
def update_contra_entry(
    record_id: int,
    payload: ContraEntryUpdate,
    db: Session = Depends(get_db),
):
    record = _call(lambda: service.get_record(db, ContraEntry, record_id))
    return _call(
        lambda: service.update_record(
            db,
            lambda: service.update_contra(
                db, record, payload.model_dump(exclude_unset=True)
            ),
        )
    )


@router.delete("/contra-entries/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contra_entry(record_id: int, db: Session = Depends(get_db)):
    record = _call(lambda: service.get_record(db, ContraEntry, record_id))
    _call(lambda: service.delete_record(db, lambda: db.delete(record)))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/journal-entries")
def list_journal_entries(db: Session = Depends(get_db)):
    return _call(
        lambda: [
            service.read_journal(record, db)
            for record in service.list_records(db, JournalEntry)
        ]
    )


@router.get("/journal-entries/{record_id}")
def get_journal_entry(record_id: int, db: Session = Depends(get_db)):
    record = _call(lambda: service.get_record(db, JournalEntry, record_id))
    return _call(lambda: service.read_journal(record, db))


@router.post("/journal-entries", status_code=status.HTTP_201_CREATED)
def create_journal_entry(payload: JournalEntryCreate, db: Session = Depends(get_db)):
    return _call(
        lambda: service.create_record(
            db, lambda: service.create_journal(db, payload.model_dump())
        )
    )


@router.put("/journal-entries/{record_id}")
def update_journal_entry(
    record_id: int,
    payload: JournalEntryUpdate,
    db: Session = Depends(get_db),
):
    record = _call(lambda: service.get_record(db, JournalEntry, record_id))
    return _call(
        lambda: service.update_record(
            db,
            lambda: service.update_journal(
                db, record, payload.model_dump(exclude_unset=True)
            ),
        )
    )


@router.delete("/journal-entries/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal_entry(record_id: int, db: Session = Depends(get_db)):
    record = _call(lambda: service.get_record(db, JournalEntry, record_id))
    _call(lambda: service.delete_record(db, lambda: db.delete(record)))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _note_routes(path: str, model, create_schema, update_schema, is_credit: bool):
    read_note = service.read_credit_note if is_credit else service.read_debit_note
    create_note = service.create_credit_note if is_credit else service.create_debit_note
    update_note = service.update_credit_note if is_credit else service.update_debit_note

    def list_notes(db: Session = Depends(get_db)):
        return _call(
            lambda: [
                read_note(record, db)
                for record in service.list_records(db, model)
            ]
        )

    def get_note(record_id: int, db: Session = Depends(get_db)):
        record = _call(lambda: service.get_record(db, model, record_id))
        return _call(lambda: read_note(record, db))

    def create_note_record(payload: create_schema, db: Session = Depends(get_db)):
        return _call(
            lambda: service.create_record(
                db, lambda: create_note(db, payload.model_dump())
            )
        )

    def update_note_record(
        record_id: int,
        payload: update_schema,
        db: Session = Depends(get_db),
    ):
        record = _call(lambda: service.get_record(db, model, record_id))
        return _call(
            lambda: service.update_record(
                db,
                lambda: update_note(
                    db, record, payload.model_dump(exclude_unset=True)
                ),
            )
        )

    def delete_note_record(record_id: int, db: Session = Depends(get_db)):
        record = _call(lambda: service.get_record(db, model, record_id))
        _call(lambda: service.delete_record(db, lambda: db.delete(record)))
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    route_name = path.replace("-", "_")
    for action, endpoint in (
        ("list", list_notes),
        ("get", get_note),
        ("create", create_note_record),
        ("update", update_note_record),
        ("delete", delete_note_record),
    ):
        endpoint.__name__ = f"{action}_{route_name}"

    router.add_api_route(path, list_notes, methods=["GET"])
    router.add_api_route(f"{path}/{{record_id}}", get_note, methods=["GET"])
    router.add_api_route(
        path,
        create_note_record,
        methods=["POST"],
        status_code=status.HTTP_201_CREATED,
    )
    router.add_api_route(f"{path}/{{record_id}}", update_note_record, methods=["PUT"])
    router.add_api_route(
        f"{path}/{{record_id}}",
        delete_note_record,
        methods=["DELETE"],
        status_code=status.HTTP_204_NO_CONTENT,
        response_class=Response,
        response_model=None,
    )


_note_routes("/credit-notes", CreditNote, CreditNoteCreate, CreditNoteUpdate, True)
_note_routes("/debit-notes", DebitNote, DebitNoteCreate, DebitNoteUpdate, False)


@router.get("/cost-elements")
def list_cost_elements(db: Session = Depends(get_db)):
    return _call(lambda: service.list_cost_elements(db))


@router.get("/cost-elements/{record_id}")
def get_cost_element(record_id: int, db: Session = Depends(get_db)):
    return _call(lambda: service.get_record(db, CostElement, record_id))


@router.post("/cost-elements", status_code=status.HTTP_201_CREATED)
def create_cost_element(payload: CostElementCreate, db: Session = Depends(get_db)):
    return _call(
        lambda: service.create_record(
            db, lambda: service.create_cost_element(db, payload.name)
        )
    )


@router.put("/cost-elements/{record_id}")
def update_cost_element(
    record_id: int,
    payload: CostElementUpdate,
    db: Session = Depends(get_db),
):
    record = _call(lambda: service.get_record(db, CostElement, record_id))
    return _call(
        lambda: service.update_record(
            db,
            lambda: service.update_cost_element(
                db, record, payload.model_dump(exclude_unset=True)
            ),
        )
    )


@router.delete("/cost-elements/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cost_element(record_id: int, db: Session = Depends(get_db)):
    record = _call(lambda: service.get_record(db, CostElement, record_id))
    _call(
        lambda: service.create_record(
            db, lambda: service.deactivate_cost_element(db, record)
        )
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
