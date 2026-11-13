from collections.abc import Callable
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.modules.profile.models import Profile
from app.modules.profile.schemas import (
    ProfileCreate,
    ProfileRead,
    ProfileUpdate,
)
from app.modules.profile.service import ProfileService

router = APIRouter(prefix="/profile", tags=["profile"])


def database_call(operation: Callable[[], Any]) -> Any:
    try:
        return operation()

    except IntegrityError as error:
        print("PROFILE DATABASE ERROR:", error.orig)

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error.orig),
        ) from error

    except SQLAlchemyError as error:
        print("PROFILE SQL ERROR:", error)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile database operation failed",
        ) from error


@router.get("/", response_model=list[ProfileRead])
def get_profiles(db: Session = Depends(get_db)):
    return database_call(
        lambda: ProfileService.get_all(db, Profile)
    )


@router.get("/{profile_id}", response_model=ProfileRead)
def get_profile(
    profile_id: int,
    db: Session = Depends(get_db),
):
    record = database_call(
        lambda: ProfileService.get_by_id(db, Profile, profile_id)
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return record


@router.post(
    "/",
    response_model=ProfileRead,
    status_code=status.HTTP_201_CREATED,
)
def create_profile(
    payload: ProfileCreate,
    db: Session = Depends(get_db),
):
    return database_call(
        lambda: ProfileService.create(db, Profile, payload)
    )


@router.put("/{profile_id}", response_model=ProfileRead)
def update_profile(
    profile_id: int,
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
):
    record = database_call(
        lambda: ProfileService.get_by_id(db, Profile, profile_id)
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return database_call(
        lambda: ProfileService.update(db, record, payload)
    )


@router.delete(
    "/{profile_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_profile(
    profile_id: int,
    db: Session = Depends(get_db),
):
    record = database_call(
        lambda: ProfileService.get_by_id(db, Profile, profile_id)
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    database_call(
        lambda: ProfileService.delete(db, record)
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)