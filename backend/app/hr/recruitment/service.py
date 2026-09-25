from sqlalchemy.orm import Session

from app.hr.recruitment.models import PreviousEmployment, UserEnquiry
from app.hr.recruitment.repository import UserEnquiryRepository
from app.hr.recruitment.schemas import (
    UserEnquiryCreate,
    UserEnquiryUpdate,
)


class UserEnquiryService:

    @staticmethod
    def create_enquiry(
        db: Session,
        payload: UserEnquiryCreate,
    ) -> UserEnquiry:

        # Create main candidate record
        enquiry = UserEnquiry(
            candidate_name=payload.candidate_name,
            father_name=payload.father_name,
            date_of_birth=payload.date_of_birth,
            blood_group=payload.blood_group,
            marital_status=payload.marital_status,
            address=payload.address,
            phone=payload.phone,
            pan=payload.pan,
            aadhaar=payload.aadhaar,
            passport_no=payload.passport_no,
            personal_email=payload.personal_email,
            emergency_phone=payload.emergency_phone_1,
            emergency_phone2=payload.emergency_phone_2,
            mother_tongue=payload.mother_tongue,
            other_languages=payload.other_languages_known,
            religion=payload.religion,
            nationality=payload.nationality,
            highest_qualification=payload.highest_qualification,
            year_of_pass=payload.year_of_pass,
            qualification_certificate=payload.highest_qualification_document,
            current_employer=payload.current_employer,
            position=payload.current_position,
            department=payload.department,
            working_period=payload.working_period,
            role_responsibilities_achievements=payload.role_responsibilities,
            current_ctc=payload.current_ctc,
            employment_documents=payload.employer_documents,
        )

        # Save candidate
        enquiry = UserEnquiryRepository.create(
            db,
            enquiry,
        )

        # -------------------------------------------------
        # FIRST PREVIOUS EMPLOYMENT
        # -------------------------------------------------

        first_previous_fields = [
            payload.previous_employer_name,
            payload.previous_employer_position,
            payload.previous_employer_department,
            payload.previous_employer_working_period,
            payload.previous_employer_role,
            payload.previous_employer_ctc,
            payload.previous_employer_documents,
        ]

        if any(
            value is not None and str(value).strip()
            for value in first_previous_fields
        ):
            previous_employment = PreviousEmployment(
                user_enquiry_id=enquiry.id,
                employer=payload.previous_employer_name,
                position=payload.previous_employer_position,
                department=payload.previous_employer_department,
                working_period=payload.previous_employer_working_period,
                ctc=payload.previous_employer_ctc,
                responsibilities=payload.previous_employer_role,
                documents=payload.previous_employer_documents,
            )

            db.add(previous_employment)

        # -------------------------------------------------
        # ADDITIONAL PREVIOUS EMPLOYMENTS
        # -------------------------------------------------

        for previous in payload.previous_employments:
            additional_employment = PreviousEmployment(
                user_enquiry_id=enquiry.id,
                employer=previous.employer,
                position=previous.position,
                department=previous.department,
                working_period=previous.working_period,
                ctc=previous.ctc,
                responsibilities=previous.responsibilities,
                documents=previous.documents,
            )

            db.add(additional_employment)

        db.commit()

        return enquiry

    @staticmethod
    def get_enquiries(db: Session):
        return UserEnquiryRepository.get_all(db)

    @staticmethod
    def get_enquiry(
        db: Session,
        enquiry_id: int,
    ):
        return UserEnquiryRepository.get_by_id(
            db,
            enquiry_id,
        )

    @staticmethod
    def update_enquiry(
        db: Session,
        enquiry_id: int,
        payload: UserEnquiryUpdate,
    ):
        data = payload.model_dump(
            exclude_unset=True
        )

        field_mapping = {
            "emergency_phone_1": "emergency_phone",
            "emergency_phone_2": "emergency_phone2",
            "other_languages_known": "other_languages",
            "highest_qualification_document": "qualification_certificate",
            "current_position": "position",
            "role_responsibilities": "role_responsibilities_achievements",
            "employer_documents": "employment_documents",
        }

        allowed_fields = {
            "candidate_name",
            "father_name",
            "date_of_birth",
            "blood_group",
            "marital_status",
            "address",
            "phone",
            "pan",
            "aadhaar",
            "passport_no",
            "personal_email",
            "emergency_phone",
            "emergency_phone2",
            "mother_tongue",
            "other_languages",
            "religion",
            "nationality",
            "highest_qualification",
            "year_of_pass",
            "qualification_certificate",
            "current_employer",
            "position",
            "department",
            "working_period",
            "role_responsibilities_achievements",
            "current_ctc",
            "employment_documents",
        }

        mapped_data = {}

        for field, value in data.items():
            model_field = field_mapping.get(
                field,
                field,
            )

            if model_field in allowed_fields:
                mapped_data[model_field] = value

        return UserEnquiryRepository.update(
            db,
            enquiry_id,
            mapped_data,
        )

    @staticmethod
    def delete_enquiry(
        db: Session,
        enquiry_id: int,
    ) -> bool:
        return UserEnquiryRepository.delete(
            db,
            enquiry_id,
        )