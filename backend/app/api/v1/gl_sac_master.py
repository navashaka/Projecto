from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.gl_sac_master import (
    GLSACMasterCreate,
    GLSACMasterResponse,
)
from app.services.gl_sac_master_service import (
    create_sac_master,
    get_all_sac_masters,
    get_sac_master,
    update_sac_master,
    delete_sac_master,
)

router = APIRouter(
    prefix="/gl-sac-masters",
    tags=["GL SAC Masters"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=GLSACMasterResponse,
)
def create_gl_sac_master(
    data: GLSACMasterCreate,
    db: Session = Depends(get_db),
):
    return create_sac_master(db, data)


@router.get(
    "/",
    response_model=list[GLSACMasterResponse],
)
def get_gl_sac_masters(
    db: Session = Depends(get_db),
):
    return get_all_sac_masters(db)


@router.get(
    "/{sac_id}",
    response_model=GLSACMasterResponse,
)
def get_gl_sac_master(
    sac_id: int,
    db: Session = Depends(get_db),
):
    sac_master = get_sac_master(db, sac_id)

    if sac_master is None:
        raise HTTPException(
            status_code=404,
            detail="GL SAC Master not found",
        )

    return sac_master


@router.put(
    "/{sac_id}",
    response_model=GLSACMasterResponse,
)
def update_gl_sac_master(
    sac_id: int,
    data: GLSACMasterCreate,
    db: Session = Depends(get_db),
):
    sac_master = update_sac_master(
        db,
        sac_id,
        data,
    )

    if sac_master is None:
        raise HTTPException(
            status_code=404,
            detail="GL SAC Master not found",
        )

    return sac_master


@router.delete(
    "/{sac_id}",
)
def delete_gl_sac_master(
    sac_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_sac_master(db, sac_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="GL SAC Master not found",
        )

    return {
        "message": "GL SAC Master deleted successfully"
    }