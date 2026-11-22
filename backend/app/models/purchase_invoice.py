"""Models for the existing Purchase module tables."""

from sqlalchemy import Column, Date, DateTime, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


class PurchaseVendor(Base):
    __tablename__ = "purchase_vendor_creation"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vendor_name = Column(String(255), nullable=False)
    street_no = Column(String(100))
    street_name = Column(String(255))
    city = Column(String(100))
    pin = Column(String(20))
    state = Column(String(100))
    country = Column(String(100))
    pan = Column(String(20))
    gstn = Column(String(20))
    email_id = Column(String(255))
    contact_no = Column(String(20))
    contact_person_name = Column(String(255))
    bank_name = Column(String(150))
    account_no = Column(String(50))
    ifsc = Column(String(20))
    msme_status = Column(String(50))
    msme_no = Column(String(50))
    activity = Column(String(100))
    bank_details = Column(Text)
    msme_details = Column(Text)
    created_at = Column(DateTime(timezone=False), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=False), server_default=text("CURRENT_TIMESTAMP"))


class PurchaseAdvanceRequisition(Base):
    __tablename__ = "purchase_advance_requisition"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vendor_id = Column(Integer)
    vendor_name = Column(String(255))
    vendor_address = Column(JSONB, nullable=True)
    vendor_bank_details = Column(JSONB, nullable=True)
    purchase_order_no = Column(String(100))
    purchase_order_date = Column(Date)
    purchase_order_value_before_gst = Column(Numeric(15, 2), server_default=text("0"))
    purchase_order_value_with_gst = Column(Numeric(15, 2), server_default=text("0"))
    advance_requested_amount = Column(Numeric(15, 2), nullable=False)
    created_by = Column(String(100))
    checked_by = Column(String(100))
    approved_by = Column(String(100))
    status = Column(String(50), server_default=text("'Draft'"))
    created_at = Column(DateTime(timezone=False), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=False), server_default=text("CURRENT_TIMESTAMP"))


class PurchaseQuotationComparison(Base):
    __tablename__ = "purchase_quotation_comparison"

    id = Column(Integer, primary_key=True, autoincrement=True)
    comparison_no = Column(String(50))
    comparison_date = Column(Date)
    vendors = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    items = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    total_amount = Column(Numeric(15, 2), server_default=text("0"))
    tax_amount = Column(Numeric(15, 2), server_default=text("0"))
    grand_total = Column(Numeric(15, 2), server_default=text("0"))
    delivery_terms = Column(Text)
    payment_terms = Column(Text)
    additional_terms_conditions = Column(Text)
    created_at = Column(DateTime(timezone=False), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=False), server_default=text("CURRENT_TIMESTAMP"))


class PurchaseOrder(Base):
    __tablename__ = "purchase_order"

    id = Column(Integer, primary_key=True, autoincrement=True)
    purchase_order_no = Column(String(50), nullable=False)
    purchase_order_date = Column(Date, server_default=text("CURRENT_DATE"))
    indent_no = Column(String(100))
    indent_date = Column(Date)
    quotation_no = Column(String(100))
    quotation_date = Column(Date)
    vendor_id = Column(Integer)
    vendor_name = Column(String(255))
    vendor_address = Column(JSONB, nullable=True)
    vendor_bank_details = Column(JSONB, nullable=True)
    items = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    total_amount = Column(Numeric(15, 2), server_default=text("0"))
    tax_amount = Column(Numeric(15, 2), server_default=text("0"))
    grand_total = Column(Numeric(15, 2), server_default=text("0"))
    delivery_terms = Column(Text)
    payment_terms = Column(Text)
    default_terms_conditions = Column(Text)
    additional_terms_conditions = Column(Text)
    created_by = Column(String(100))
    checked_by = Column(String(100))
    approved_by = Column(String(100))
    status = Column(String(50), server_default=text("'Draft'"))
    created_at = Column(DateTime(timezone=False), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=False), server_default=text("CURRENT_TIMESTAMP"))
