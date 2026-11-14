from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.api.deps import get_db
from app.modules.production import schemas
from app.modules.production.service import ProductionService

router = APIRouter(prefix="/production", tags=["Production"])


def database_call(operation):
    try:
        return operation()
    except IntegrityError as error:
        db_error = error
        raise HTTPException(
            status_code=409,
            detail="Production record violates a database constraint"
        ) from db_error
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=500,
            detail="Production database operation failed"
        ) from error


@router.get("/", response_model=list[schemas.ProductionRead])
def get_productions(db: Session = Depends(get_db)):
    return database_call(lambda: ProductionService.get_all(db))


@router.get("/{production_id}", response_model=schemas.ProductionRead)
def get_production(production_id: int, db: Session = Depends(get_db)):
    record = database_call(
        lambda: ProductionService.get_by_id(db, production_id)
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Production not found")
    return record


@router.post(
    "/",
    response_model=schemas.ProductionRead,
    status_code=status.HTTP_201_CREATED
)
def create_production(
    payload: schemas.ProductionCreate,
    db: Session = Depends(get_db)
):
    return database_call(lambda: ProductionService.create(db, payload))


@router.put("/{production_id}", response_model=schemas.ProductionRead)
def update_production(
    production_id: int,
    payload: schemas.ProductionUpdate,
    db: Session = Depends(get_db)
):
    record = database_call(
        lambda: ProductionService.get_by_id(db, production_id)
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Production not found")
    return database_call(
        lambda: ProductionService.update(db, record, payload)
    )


@router.delete("/{production_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_production(
    production_id: int,
    db: Session = Depends(get_db)
):
    record = database_call(
        lambda: ProductionService.get_by_id(db, production_id)
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Production not found")

    database_call(lambda: ProductionService.delete(db, record))
    return None


@router.post("/entries/", response_model=schemas.ProductionEntryRead,
             status_code=status.HTTP_201_CREATED)
def create_production_entry(
    payload: schemas.ProductionEntryCreate,
    db: Session = Depends(get_db)
):
    return database_call(
        lambda: ProductionService.create_entry(db, payload)
    )


@router.get("/entries/{production_id}",
            response_model=list[schemas.ProductionEntryRead])
def get_production_entries(
    production_id: int,
    db: Session = Depends(get_db)
):
    return database_call(
        lambda: ProductionService.get_entries(db, production_id)
    )