from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.gl_cheque_range import (
    GLChequeRangeCreate,
    GLChequeRangeResponse,
)
from app.services.gl_cheque_range_service import (
    create_cheque_range,
    get_all_cheque_ranges,
    get_cheque_range,
    update_cheque_range,
    delete_cheque_range,
)

router = APIRouter(
    prefix="/gl-cheque-ranges",
    tags=["GL Cheque Ranges"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=GLChequeRangeResponse,
)
def create_gl_cheque_range(
    data: GLChequeRangeCreate,
    db: Session = Depends(get_db),
):
    return create_cheque_range(db, data)


@router.get(
    "/",
    response_model=list[GLChequeRangeResponse],
)
def get_gl_cheque_ranges(
    db: Session = Depends(get_db),
):
    return get_all_cheque_ranges(db)


@router.get(
    "/{cheque_range_id}",
    response_model=GLChequeRangeResponse,
)
def get_gl_cheque_range(
    cheque_range_id: int,
    db: Session = Depends(get_db),
):
    cheque_range = get_cheque_range(
        db,
        cheque_range_id,
    )

    if cheque_range is None:
        raise HTTPException(
            status_code=404,
            detail="GL Cheque Range not found",
        )

    return cheque_range


@router.put(
    "/{cheque_range_id}",
    response_model=GLChequeRangeResponse,
)
def update_gl_cheque_range(
    cheque_range_id: int,
    data: GLChequeRangeCreate,
    db: Session = Depends(get_db),
):
    cheque_range = update_cheque_range(
        db,
        cheque_range_id,
        data,
    )

    if cheque_range is None:
        raise HTTPException(
            status_code=404,
            detail="GL Cheque Range not found",
        )

    return cheque_range


@router.delete(
    "/{cheque_range_id}",
)
def delete_gl_cheque_range(
    cheque_range_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_cheque_range(
        db,
        cheque_range_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="GL Cheque Range not found",
        )

    return {
        "message": "GL Cheque Range deleted successfully"
    }