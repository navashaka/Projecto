from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Production(Base):
    __tablename__ = "production"

    id = Column(Integer, primary_key=True, index=True)
    output_product_name = Column(String(255), nullable=False)
    uom = Column(String(50))
    hsn = Column(String(50))
    cost_element = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    input_items = relationship(
        "ProductionInputItem",
        back_populates="production",
        cascade="all, delete-orphan"
    )
    entries = relationship(
        "ProductionEntry",
        back_populates="production"
    )


class ProductionInputItem(Base):
    __tablename__ = "production_input_items"

    id = Column(Integer, primary_key=True, index=True)
    production_id = Column(
        Integer, ForeignKey("production.id", ondelete="CASCADE"),
        nullable=False
    )
    input_item_name = Column(String(255), nullable=False)

    production = relationship("Production", back_populates="input_items")


class ProductionEntry(Base):
    __tablename__ = "production_entries"

    id = Column(Integer, primary_key=True, index=True)
    production_id = Column(Integer, ForeignKey("production.id"), nullable=False)
    production_date = Column(Date, nullable=False)
    shift_a = Column(Numeric(12, 2), default=0)
    shift_b = Column(Numeric(12, 2), default=0)
    shift_c = Column(Numeric(12, 2), default=0)
    total_qty = Column(Numeric(12, 2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    production = relationship("Production", back_populates="entries")
    consumption = relationship(
        "ProductionConsumption",
        back_populates="production_entry",
        cascade="all, delete-orphan"
    )


class ProductionConsumption(Base):
    __tablename__ = "production_consumption"

    id = Column(Integer, primary_key=True, index=True)
    production_entry_id = Column(
        Integer,
        ForeignKey("production_entries.id", ondelete="CASCADE"),
        nullable=False
    )
    input_item_name = Column(String(255), nullable=False)
    qty_consumed = Column(Numeric(12, 2), nullable=False, default=0)

    production_entry = relationship(
        "ProductionEntry",
        back_populates="consumption"
    )