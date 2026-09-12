from sqlalchemy.orm import Session

from app.hr.recruitment.models import UserEnquiry
from app.hr.recruitment.repository import UserEnquiryRepository
from app.hr.recruitment.schemas import UserEnquiryCreate


class UserEnquiryService:
    @staticmethod
    def create_enquiry(db: Session, payload: UserEnquiryCreate) -> UserEnquiry:
        enquiry = UserEnquiry(**payload.model_dump())
        return UserEnquiryRepository.create(db, enquiry)

    @staticmethod
    def get_enquiries(db: Session):
        return UserEnquiryRepository.get_all(db)

    @staticmethod
    def get_enquiry(db: Session, enquiry_id: int):
        return UserEnquiryRepository.get_by_id(db, enquiry_id)

