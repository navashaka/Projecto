from sqlalchemy.orm import Session, selectinload
from app.modules.production.models import (
    Production,
    ProductionInputItem,
    ProductionEntry,
    ProductionConsumption,
)


class ProductionService:

    @staticmethod
    def get_all(db: Session):
        return db.query(Production).options(
            selectinload(Production.input_items)
        ).all()

    @staticmethod
    def get_by_id(db: Session, production_id: int):
        return db.query(Production).options(
            selectinload(Production.input_items)
        ).filter(Production.id == production_id).first()

    @staticmethod
    def create(db: Session, payload):
        data = payload.model_dump()
        input_items = data.pop("input_items", [])

        record = Production(**data)
        record.input_items = [
            ProductionInputItem(**item) for item in input_items
        ]

        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def update(db: Session, record, payload):
        data = payload.model_dump(exclude_unset=True)
        input_items = data.pop("input_items", None)

        for key, value in data.items():
            setattr(record, key, value)

        if input_items is not None:
            record.input_items = [
                ProductionInputItem(**item) for item in input_items
            ]

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def delete(db: Session, record):
        db.delete(record)
        db.commit()

    @staticmethod
    def create_entry(db: Session, payload):
        data = payload.model_dump()
        consumption = data.pop("consumption", [])

        total_qty = (
            data["shift_a"] + data["shift_b"] + data["shift_c"]
        )

        record = ProductionEntry(**data, total_qty=total_qty)
        record.consumption = [
            ProductionConsumption(**item) for item in consumption
        ]

        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_entries(db: Session, production_id: int):
        return db.query(ProductionEntry).options(
            selectinload(ProductionEntry.consumption)
        ).filter(
            ProductionEntry.production_id == production_id
        ).all()