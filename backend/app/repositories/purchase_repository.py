"""Purchase data access repository."""

from typing import TypeVar

from sqlalchemy.orm import Session

from app.core.database import Base
from app.models.purchase_invoice import (
    PurchaseAdvanceRequisition,
    PurchaseOrder,
    PurchaseQuotationComparison,
    PurchaseVendor,
)

PurchaseModel = TypeVar("PurchaseModel", bound=Base)

PURCHASE_MODELS: dict[str, type[Base]] = {
    "vendors": PurchaseVendor,
    "advance-requisitions": PurchaseAdvanceRequisition,
    "quotation-comparisons": PurchaseQuotationComparison,
    "orders": PurchaseOrder,
}


class PurchaseRepository:
    @staticmethod
    def get_all(db: Session, model: type[PurchaseModel]) -> list[PurchaseModel]:
        return db.query(model).order_by(model.id.desc()).all()

    @staticmethod
    def get_by_id(
        db: Session, model: type[PurchaseModel], record_id: int
    ) -> PurchaseModel | None:
        return db.query(model).filter(model.id == record_id).first()

    @staticmethod
    def create(db: Session, record: PurchaseModel) -> PurchaseModel:
        try:
            db.add(record)
            db.commit()
            db.refresh(record)
            return record
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def update(db: Session, record: PurchaseModel) -> PurchaseModel:
        try:
            db.commit()
            db.refresh(record)
            return record
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def delete(db: Session, record: PurchaseModel) -> None:
        try:
            db.delete(record)
            db.commit()
        except Exception:
            db.rollback()
            raise
