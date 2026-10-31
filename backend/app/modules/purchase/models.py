from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


class PurchaseVendorCreation(Base):
    __tablename__ = "purchase_vendor_creation"

    id = Column(Integer, primary_key=True, index=True)
    vendor_name = Column(String(255), nullable=False)

    street_no = Column(String(100), nullable=True)
    street_name = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    pin = Column(String(20), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)

    pan = Column(String(20), nullable=True)
    gstn = Column(String(20), nullable=True)
    email_id = Column(String(255), nullable=True)
    contact_no = Column(String(20), nullable=True)
    contact_person_name = Column(String(255), nullable=True)

    account_no = Column(String(50), nullable=True)
    ifsc = Column(String(20), nullable=True)

    msme_status = Column(String(50), nullable=True)
    msme_no = Column(String(50), nullable=True)
    activity = Column(String(100), nullable=True)

    created_at = Column(
        DateTime, nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )


class PurchaseQuotationComparison(Base):
    __tablename__ = "purchase_quotation_comparison"

    id = Column(Integer, primary_key=True, index=True)
    comparison_no = Column(String(50), unique=True, nullable=True)
    comparison_date = Column(Date, nullable=True)

    vendors = Column(
        JSONB, nullable=False,
        server_default=text("'[]'::jsonb")
    )
    items = Column(
        JSONB, nullable=False,
        server_default=text("'[]'::jsonb")
    )

    total_amount = Column(
        Numeric(15, 2), server_default=text("0")
    )
    tax_amount = Column(
        Numeric(15, 2), server_default=text("0")
    )
    grand_total = Column(
        Numeric(15, 2), server_default=text("0")
    )

    delivery_terms = Column(Text, nullable=True)
    payment_terms = Column(Text, nullable=True)
    additional_terms_conditions = Column(Text, nullable=True)

    created_at = Column(
        DateTime, nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )


class PurchaseOrder(Base):
    __tablename__ = "purchase_order"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_no = Column(
        String(50), unique=True, nullable=False
    )
    purchase_order_date = Column(
        Date, server_default=text("CURRENT_DATE")
    )

    indent_no = Column(String(100), nullable=True)
    indent_date = Column(Date, nullable=True)
    quotation_no = Column(String(100), nullable=True)
    quotation_date = Column(Date, nullable=True)

    vendor_id = Column(Integer, nullable=True)
    vendor_name = Column(String(255), nullable=True)
    vendor_address = Column(JSONB, nullable=True)
    vendor_bank_details = Column(JSONB, nullable=True)

    items = Column(
        JSONB, nullable=False,
        server_default=text("'[]'::jsonb")
    )

    total_amount = Column(
        Numeric(15, 2), server_default=text("0")
    )
    tax_amount = Column(
        Numeric(15, 2), server_default=text("0")
    )
    grand_total = Column(
        Numeric(15, 2), server_default=text("0")
    )

    delivery_terms = Column(Text, nullable=True)
    payment_terms = Column(Text, nullable=True)
    default_terms_conditions = Column(Text, nullable=True)
    additional_terms_conditions = Column(Text, nullable=True)

    created_by = Column(String(100), nullable=True)
    checked_by = Column(String(100), nullable=True)
    approved_by = Column(String(100), nullable=True)

    status = Column(
        String(50), nullable=False,
        server_default=text("'Draft'")
    )

    created_at = Column(
        DateTime, nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )


class PurchaseAdvanceRequisition(Base):
    __tablename__ = "purchase_advance_requisition"

    id = Column(Integer, primary_key=True, index=True)

    vendor_id = Column(Integer, nullable=True)
    vendor_name = Column(String(255), nullable=True)
    vendor_address = Column(JSONB, nullable=True)
    vendor_bank_details = Column(JSONB, nullable=True)

    purchase_order_no = Column(String(100), nullable=True)
    purchase_order_date = Column(Date, nullable=True)

    purchase_order_value_before_gst = Column(
        Numeric(15, 2), nullable=False,
        server_default=text("0")
    )
    purchase_order_value_with_gst = Column(
        Numeric(15, 2), nullable=False,
        server_default=text("0")
    )

    advance_requested_amount = Column(
        Numeric(15, 2), nullable=False
    )

    created_by = Column(String(100), nullable=True)
    checked_by = Column(String(100), nullable=True)
    approved_by = Column(String(100), nullable=True)

    status = Column(
        String(50), nullable=False,
        server_default=text("'Draft'")
    )

    created_at = Column(
        DateTime, nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )