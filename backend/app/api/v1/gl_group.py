from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.gl_group import GLGroupCreate, GLGroupResponse
from app.services.gl_group_service import (
    create_group,
    get_all_groups,
    get_group,
    update_group,
    delete_group,
)


router = APIRouter(
    prefix="/gl-groups",
    tags=["GL Groups"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=GLGroupResponse,
)
def create_gl_group(
    data: GLGroupCreate,
    db: Session = Depends(get_db),
):
    return create_group(db, data)


@router.get(
    "/",
    response_model=list[GLGroupResponse],
)
def get_gl_groups(
    db: Session = Depends(get_db),
):
    return get_all_groups(db)


@router.get(
    "/{group_id}",
    response_model=GLGroupResponse,
)
def get_gl_group(
    group_id: int,
    db: Session = Depends(get_db),
):
    group = get_group(db, group_id)

    if group is None:
        raise HTTPException(
            status_code=404,
            detail="GL Group not found",
        )

    return group


@router.put(
    "/{group_id}",
    response_model=GLGroupResponse,
)
def update_gl_group(
    group_id: int,
    data: GLGroupCreate,
    db: Session = Depends(get_db),
):
    group = update_group(db, group_id, data)

    if group is None:
        raise HTTPException(
            status_code=404,
            detail="GL Group not found",
        )

    return group


@router.delete(
    "/{group_id}",
)
def delete_gl_group(
    group_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_group(db, group_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="GL Group not found",
        )

    return {
        "message": "GL Group deleted successfully"
    }