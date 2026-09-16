from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.hr.recruitment.schemas import (
    UserEnquiryCreate,
    UserEnquiryRead,
    UserEnquiryUpdate,
)
from app.hr.recruitment.service import UserEnquiryService

router = APIRouter(prefix="/user-enquiries", tags=["user-enquiries"])


@router.post("/", response_model=UserEnquiryRead, status_code=status.HTTP_201_CREATED)
def create_user_enquiry(payload: UserEnquiryCreate, db: Session = Depends(get_db)):
    return UserEnquiryService.create_enquiry(db, payload)


@router.get("/", response_model=list[UserEnquiryRead])
def list_user_enquiries(db: Session = Depends(get_db)):
    return UserEnquiryService.get_enquiries(db)


@router.get("/{enquiry_id}", response_model=UserEnquiryRead)
def get_user_enquiry(enquiry_id: int, db: Session = Depends(get_db)):
    enquiry = UserEnquiryService.get_enquiry(db, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail="User enquiry not found")
    return enquiry


@router.put("/{enquiry_id}", response_model=UserEnquiryRead)
def update_user_enquiry(
    enquiry_id: int,
    payload: UserEnquiryUpdate,
    db: Session = Depends(get_db),
):
    enquiry = UserEnquiryService.update_enquiry(db, enquiry_id, payload)
    if not enquiry:
        raise HTTPException(status_code=404, detail="User enquiry not found")
    return enquiry


@router.delete("/{enquiry_id}")
def delete_user_enquiry(enquiry_id: int, db: Session = Depends(get_db)):
    if not UserEnquiryService.delete_enquiry(db, enquiry_id):
        raise HTTPException(status_code=404, detail="User enquiry not found")
    return {"detail": "User enquiry deleted"}

