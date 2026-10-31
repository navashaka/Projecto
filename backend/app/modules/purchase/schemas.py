from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel


class PurchaseBaseSchema(BaseModel):
    class Config:
        orm_mode = True


class VendorCreate(PurchaseBaseSchema):
    vendor_name: str
    street_no: Optional[str] = None
    street_name: Optional[str] = None
    city: Optional[str] = None
    pin: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pan: Optional[str] = None
    gstn: Optional[str] = None
    email_id: Optional[str] = None
    contact_no: Optional[str] = None
    contact_person_name: Optional[str] = None
    account_no: Optional[str] = None
    ifsc: Optional[str] = None
    msme_status: Optional[str] = None
    msme_no: Optional[str] = None
    activity: Optional[str] = None


class VendorUpdate(PurchaseBaseSchema):
    vendor_name: Optional[str] = None
    street_no: Optional[str] = None
    street_name: Optional[str] = None
    city: Optional[str] = None
    pin: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pan: Optional[str] = None
    gstn: Optional[str] = None
    email_id: Optional[str] = None
    contact_no: Optional[str] = None
    contact_person_name: Optional[str] = None
    account_no: Optional[str] = None
    ifsc: Optional[str] = None
    msme_status: Optional[str] = None
    msme_no: Optional[str] = None
    activity: Optional[str] = None


class VendorResponse(VendorCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class QuotationComparisonCreate(PurchaseBaseSchema):
    comparison_no: Optional[str] = None
    comparison_date: Optional[date] = None
    vendors: list[dict[str, Any]] = []
    items: list[dict[str, Any]] = []
    total_amount: Decimal = 0
    tax_amount: Decimal = 0
    grand_total: Decimal = 0
    delivery_terms: Optional[str] = None
    payment_terms: Optional[str] = None
    additional_terms_conditions: Optional[str] = None


class QuotationComparisonUpdate(PurchaseBaseSchema):
    comparison_no: Optional[str] = None
    comparison_date: Optional[date] = None
    vendors: Optional[list[dict[str, Any]]] = None
    items: Optional[list[dict[str, Any]]] = None
    total_amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    grand_total: Optional[Decimal] = None
    delivery_terms: Optional[str] = None
    payment_terms: Optional[str] = None
    additional_terms_conditions: Optional[str] = None


class QuotationComparisonResponse(QuotationComparisonCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class PurchaseOrderCreate(PurchaseBaseSchema):
    purchase_order_no: str
    purchase_order_date: Optional[date] = None
    indent_no: Optional[str] = None
    indent_date: Optional[date] = None
    quotation_no: Optional[str] = None
    quotation_date: Optional[date] = None
    vendor_id: Optional[int] = None
    vendor_name: Optional[str] = None
    vendor_address: Optional[dict[str, Any]] = None
    vendor_bank_details: Optional[dict[str, Any]] = None
    items: list[dict[str, Any]] = []
    total_amount: Decimal = 0
    tax_amount: Decimal = 0
    grand_total: Decimal = 0
    delivery_terms: Optional[str] = None
    payment_terms: Optional[str] = None
    default_terms_conditions: Optional[str] = None
    additional_terms_conditions: Optional[str] = None
    created_by: Optional[str] = None
    checked_by: Optional[str] = None
    approved_by: Optional[str] = None
    status: str = "Draft"


class PurchaseOrderUpdate(PurchaseBaseSchema):
    purchase_order_no: Optional[str] = None
    purchase_order_date: Optional[date] = None
    indent_no: Optional[str] = None
    indent_date: Optional[date] = None
    quotation_no: Optional[str] = None
    quotation_date: Optional[date] = None
    vendor_id: Optional[int] = None
    vendor_name: Optional[str] = None
    vendor_address: Optional[dict[str, Any]] = None
    vendor_bank_details: Optional[dict[str, Any]] = None
    items: Optional[list[dict[str, Any]]] = None
    total_amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    grand_total: Optional[Decimal] = None
    delivery_terms: Optional[str] = None
    payment_terms: Optional[str] = None
    default_terms_conditions: Optional[str] = None
    additional_terms_conditions: Optional[str] = None
    created_by: Optional[str] = None
    checked_by: Optional[str] = None
    approved_by: Optional[str] = None
    status: Optional[str] = None


class PurchaseOrderResponse(PurchaseOrderCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class AdvanceRequisitionCreate(PurchaseBaseSchema):
    vendor_id: Optional[int] = None
    vendor_name: Optional[str] = None
    vendor_address: Optional[dict[str, Any]] = None
    vendor_bank_details: Optional[dict[str, Any]] = None
    purchase_order_no: Optional[str] = None
    purchase_order_date: Optional[date] = None
    purchase_order_value_before_gst: Decimal = 0
    purchase_order_value_with_gst: Decimal = 0
    advance_requested_amount: Decimal
    created_by: Optional[str] = None
    checked_by: Optional[str] = None
    approved_by: Optional[str] = None
    status: str = "Draft"


class AdvanceRequisitionUpdate(PurchaseBaseSchema):
    vendor_id: Optional[int] = None
    vendor_name: Optional[str] = None
    vendor_address: Optional[dict[str, Any]] = None
    vendor_bank_details: Optional[dict[str, Any]] = None
    purchase_order_no: Optional[str] = None
    purchase_order_date: Optional[date] = None
    purchase_order_value_before_gst: Optional[Decimal] = None
    purchase_order_value_with_gst: Optional[Decimal] = None
    advance_requested_amount: Optional[Decimal] = None
    created_by: Optional[str] = None
    checked_by: Optional[str] = None
    approved_by: Optional[str] = None
    status: Optional[str] = None


class AdvanceRequisitionResponse(AdvanceRequisitionCreate):
    id: int
    created_at: datetime
    updated_at: datetime