from sqlalchemy.orm import Session

from app.hr.recruitment.models import UserEnquiry


class UserEnquiryRepository:
    @staticmethod
    def create(db: Session, enquiry: UserEnquiry) -> UserEnquiry:
        db.add(enquiry)
        db.commit()
        db.refresh(enquiry)
        return enquiry

    @staticmethod
    def get_all(db: Session):
        return db.query(UserEnquiry).all()

    @staticmethod
    def get_by_id(db: Session, enquiry_id: int):
        return db.query(UserEnquiry).filter(UserEnquiry.id == enquiry_id).first()

    @staticmethod
    def update(db: Session, enquiry_id: int, payload: dict):
        enquiry = UserEnquiryRepository.get_by_id(db, enquiry_id)
        if not enquiry:
            return None

        for field, value in payload.items():
            setattr(enquiry, field, value)

        db.commit()
        db.refresh(enquiry)
        return enquiry

    @staticmethod
    def delete(db: Session, enquiry_id: int) -> bool:
        enquiry = UserEnquiryRepository.get_by_id(db, enquiry_id)
        if not enquiry:
            return False

        db.delete(enquiry)
        db.commit()
        return True

