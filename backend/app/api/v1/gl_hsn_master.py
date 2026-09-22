from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.gl_hsn_master import (
    GLHSNMasterCreate,
    GLHSNMasterResponse,
)
from app.services.gl_hsn_master_service import (
    create_hsn_master,
    get_all_hsn_masters,
    get_hsn_master,
    update_hsn_master,
    delete_hsn_master,
)

router = APIRouter(
    prefix="/gl-hsn-masters",
    tags=["GL HSN Masters"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=GLHSNMasterResponse,
)
def create_gl_hsn_master(
    data: GLHSNMasterCreate,
    db: Session = Depends(get_db),
):
    return create_hsn_master(db, data)


@router.get(
    "/",
    response_model=list[GLHSNMasterResponse],
)
def get_gl_hsn_masters(
    db: Session = Depends(get_db),
):
    return get_all_hsn_masters(db)


@router.get(
    "/{hsn_id}",
    response_model=GLHSNMasterResponse,
)
def get_gl_hsn_master(
    hsn_id: int,
    db: Session = Depends(get_db),
):
    hsn_master = get_hsn_master(db, hsn_id)

    if hsn_master is None:
        raise HTTPException(
            status_code=404,
            detail="GL HSN Master not found",
        )

    return hsn_master


@router.put(
    "/{hsn_id}",
    response_model=GLHSNMasterResponse,
)
def update_gl_hsn_master(
    hsn_id: int,
    data: GLHSNMasterCreate,
    db: Session = Depends(get_db),
):
    hsn_master = update_hsn_master(
        db,
        hsn_id,
        data,
    )

    if hsn_master is None:
        raise HTTPException(
            status_code=404,
            detail="GL HSN Master not found",
        )

    return hsn_master


@router.delete(
    "/{hsn_id}",
)
def delete_gl_hsn_master(
    hsn_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_hsn_master(db, hsn_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="GL HSN Master not found",
        )

    return {
        "message": "GL HSN Master deleted successfully"
    }