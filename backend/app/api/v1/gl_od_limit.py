from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.gl_od_limit import (
    GLOdLimitCreate,
    GLOdLimitResponse,
)
from app.services.gl_od_limit_service import (
    create_od_limit_service,
    get_od_limits_service,
    get_od_limit_service,
    update_od_limit_service,
    delete_od_limit_service,
)

router = APIRouter(
    prefix="/gl-od-limits",
    tags=["GL OD Limits"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=GLOdLimitResponse,
)
def create_od_limit(
    data: GLOdLimitCreate,
    db: Session = Depends(get_db),
):
    return create_od_limit_service(db, data)


@router.get(
    "/",
    response_model=list[GLOdLimitResponse],
)
def get_od_limits(
    db: Session = Depends(get_db),
):
    return get_od_limits_service(db)


@router.get(
    "/{od_limit_id}",
    response_model=GLOdLimitResponse,
)
def get_od_limit(
    od_limit_id: int,
    db: Session = Depends(get_db),
):
    result = get_od_limit_service(db, od_limit_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="OD Limit not found",
        )

    return result


@router.put(
    "/{od_limit_id}",
    response_model=GLOdLimitResponse,
)
def update_od_limit(
    od_limit_id: int,
    data: GLOdLimitCreate,
    db: Session = Depends(get_db),
):
    result = update_od_limit_service(
        db,
        od_limit_id,
        data,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="OD Limit not found",
        )

    return result


@router.delete(
    "/{od_limit_id}",
)
def delete_od_limit(
    od_limit_id: int,
    db: Session = Depends(get_db),
):
    result = delete_od_limit_service(
        db,
        od_limit_id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="OD Limit not found",
        )

    return {
        "message": "OD Limit deleted successfully"
    }