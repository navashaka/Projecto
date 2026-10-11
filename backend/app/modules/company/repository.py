from sqlalchemy.orm import Session

from app.models.company import Company


def create_company(db: Session, company_data: dict) -> Company:
    company = Company(**company_data)

    db.add(company)
    db.commit()
    db.refresh(company)

    return company