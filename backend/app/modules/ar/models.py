from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class ARCustomer(Base):
    __tablename__ = "ar_customers"

    id = Column(BigInteger, primary_key=True, index=True)
    customer_name = Column(String(200), nullable=False)
    bill_to_address = Column(String(500))
    street_number = Column(String(50))
    street_name = Column(String(255))
    city = Column(String(100))
    pin = Column(String(20))
    state = Column(String(100))
    country = Column(String(100))
    region = Column(String(100))
    industry = Column(String(150))
    pan = Column(String(10), nullable=False)
    gstn = Column(String(15))
    email_id = Column(String(254))
    contact_no = Column(String(20))
    contact_person_name = Column(String(200))
    ship_to_address = Column(String(500))
    ship_to_street_number = Column(String(50))
    ship_to_street_name = Column(String(255))
    ship_to_city = Column(String(100))
    ship_to_pin = Column(String(20))
    ship_to_state = Column(String(100))
    ship_to_country = Column(String(100))
    msme_status = Column(String(50))
    msme_no = Column(String(50))
    activity = Column(String(50))
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    bank_accounts = relationship(
        "ARCustomerBankAccount",
        back_populates="customer",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    quotations = relationship("ARQuotation", back_populates="customer")


class ARCustomerBankAccount(Base):
    __tablename__ = "ar_customer_bank_accounts"

    id = Column(BigInteger, primary_key=True, index=True)
    customer_id = Column(
        BigInteger,
        ForeignKey("ar_customers.id"),
        nullable=False,
    )
    account_no = Column(String(50), nullable=False)
    ifsc = Column(String(11), nullable=False)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    customer = relationship("ARCustomer", back_populates="bank_accounts")


class ARQuotation(Base):
    __tablename__ = "ar_quotations"

    id = Column(BigInteger, primary_key=True, index=True)
    quotation_no = Column(
        String(50),
        server_default=text(
            "('ARQ-'::text || lpad((nextval('ar_quotation_no_seq'::regclass))::text, 6, '0'::text))"
        ),
    )
    quotation_date = Column(
        Date,
        nullable=False,
        server_default=text("CURRENT_DATE"),
    )
    customer_id = Column(
        BigInteger,
        ForeignKey("ar_customers.id"),
        nullable=False,
    )
    vendor_name = Column(String(200))
    street_number = Column(String(50))
    street_name = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    pin = Column(String(20))
    delivery_to_street_number = Column(String(50))
    delivery_to_street_name = Column(String(255))
    delivery_to_city = Column(String(100))
    delivery_to_state = Column(String(100))
    delivery_to_country = Column(String(100))
    delivery_to_pin = Column(String(20))
    total = Column(Numeric(14, 2), server_default=text("0"))
    gst = Column(Numeric(14, 2), server_default=text("0"))
    grand_total = Column(Numeric(14, 2), server_default=text("0"))
    terms_of_delivery = Column(Text)
    terms_of_payment = Column(Text)
    created_by = Column(String(100))
    checked_by = Column(String(100))
    approved_by = Column(String(100))
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    quotation_number_prefix = Column(String(10))

    customer = relationship("ARCustomer", back_populates="quotations")
    items = relationship(
        "ARQuotationItem",
        back_populates="quotation",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ARQuotationItem(Base):
    __tablename__ = "ar_quotation_items"

    id = Column(BigInteger, primary_key=True, index=True)
    quotation_id = Column(
        BigInteger,
        ForeignKey("ar_quotations.id"),
        nullable=False,
    )
    item_no = Column(Integer, nullable=False)
    product_item_description = Column(Text, nullable=False)
    quantity = Column(Numeric(14, 3), nullable=False, server_default=text("0"))
    rate = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    amount = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    quotation = relationship("ARQuotation", back_populates="items")


class ARProformaInvoice(Base):
    __tablename__ = "ar_proforma_invoices"

    id = Column(BigInteger, primary_key=True, index=True)
    proforma_invoice_no = Column(String(50))
    proforma_invoice_date = Column(
        Date,
        nullable=False,
        server_default=text("CURRENT_DATE"),
    )
    proforma_invoice_type = Column(String(20), nullable=False)
    dispatch_type = Column(String(50))
    oc_id = Column(BigInteger)
    quotation_id = Column(BigInteger, ForeignKey("ar_quotations.id"))
    order_by = Column(String(150))
    asm = Column(String(150))
    order_approved_by = Column(String(150))
    consignee_customer_name = Column(String(200))
    consignee_street_number = Column(String(50))
    consignee_street_name = Column(String(255))
    consignee_city = Column(String(100))
    consignee_state = Column(String(100))
    consignee_zip_code = Column(String(20))
    consignee_country = Column(String(100))
    consignee_pan = Column(String(10))
    consignee_gstn = Column(String(15))
    buyer_customer_id = Column(BigInteger, ForeignKey("ar_customers.id"))
    buyer_customer_name = Column(String(200))
    buyer_street_number = Column(String(50))
    buyer_street_name = Column(String(255))
    buyer_city = Column(String(100))
    buyer_state = Column(String(100))
    buyer_zip_code = Column(String(20))
    buyer_country = Column(String(100))
    buyer_pan = Column(String(10))
    buyer_gstn = Column(String(15))
    customer_purchase_order_no = Column(String(100))
    po_date = Column(Date)
    total = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    gst = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    grand_total = Column(
        Numeric(14, 2),
        nullable=False,
        server_default=text("0"),
    )
    terms_of_delivery = Column(Text)
    terms_of_payment = Column(Text)
    created_by = Column(String(150))
    checked_by = Column(String(150))
    approved_by = Column(String(150))
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    quotation = relationship("ARQuotation")
    buyer_customer = relationship("ARCustomer")
    items = relationship(
        "ARProformaInvoiceItem",
        back_populates="proforma_invoice",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ARProformaInvoiceItem(Base):
    __tablename__ = "ar_proforma_invoice_items"

    id = Column(BigInteger, primary_key=True, index=True)
    proforma_invoice_id = Column(
        BigInteger,
        ForeignKey("ar_proforma_invoices.id"),
        nullable=False,
    )
    sl_no = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    hsn = Column(String(20))
    quantity = Column(Numeric(14, 3), nullable=False, server_default=text("0"))
    rate = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    uom = Column(String(30))
    value = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    gst_rate = Column(Numeric(6, 3), nullable=False, server_default=text("0"))
    tax = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    total_amount = Column(
        Numeric(14, 2),
        nullable=False,
        server_default=text("0"),
    )
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    proforma_invoice = relationship(
        "ARProformaInvoice",
        back_populates="items",
    )


class ARInvoice(Base):
    __tablename__ = "ar_invoices"

    id = Column(BigInteger, primary_key=True, index=True)
    invoice_no = Column(String(50))
    invoice_date = Column(Date, nullable=False, server_default=text("CURRENT_DATE"))
    invoice_type = Column(String(20), nullable=False)
    dispatch_type = Column(String(20))
    oc_id = Column(BigInteger)
    proforma_invoice_id = Column(
        BigInteger,
        ForeignKey("ar_proforma_invoices.id"),
    )
    quotation_id = Column(BigInteger, ForeignKey("ar_quotations.id"))
    order_by = Column(String(150))
    asm = Column(String(150))
    order_approved_by = Column(String(150))
    consignee_customer_name = Column(String(200))
    consignee_street_number = Column(String(50))
    consignee_street_name = Column(String(255))
    consignee_city = Column(String(100))
    consignee_state = Column(String(100))
    consignee_zip_code = Column(String(20))
    consignee_country = Column(String(100))
    consignee_pan = Column(String(10))
    consignee_gstn = Column(String(15))
    buyer_customer_id = Column(BigInteger, ForeignKey("ar_customers.id"))
    buyer_customer_name = Column(String(200))
    buyer_street_number = Column(String(50))
    buyer_street_name = Column(String(255))
    buyer_city = Column(String(100))
    buyer_state = Column(String(100))
    buyer_zip_code = Column(String(20))
    buyer_country = Column(String(100))
    buyer_pan = Column(String(10))
    buyer_gstn = Column(String(15))
    customer_purchase_order_no = Column(String(100))
    po_date = Column(Date)
    total = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    gst = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    grand_total = Column(
        Numeric(14, 2),
        nullable=False,
        server_default=text("0"),
    )
    generate_ewaybill = Column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    terms_of_delivery = Column(Text)
    terms_of_payment = Column(Text)
    created_by = Column(String(150))
    checked_by = Column(String(150))
    approved_by = Column(String(150))
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    quotation = relationship("ARQuotation")
    proforma_invoice = relationship("ARProformaInvoice")
    buyer_customer = relationship("ARCustomer")
    items = relationship(
        "ARInvoiceItem",
        back_populates="invoice",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ARInvoiceItem(Base):
    __tablename__ = "ar_invoice_items"

    id = Column(BigInteger, primary_key=True, index=True)
    invoice_id = Column(
        BigInteger,
        ForeignKey("ar_invoices.id"),
        nullable=False,
    )
    sl_no = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    hsn = Column(String(20))
    quantity = Column(Numeric(14, 3), nullable=False, server_default=text("0"))
    rate = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    uom = Column(String(30))
    value = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    gst_rate = Column(Numeric(6, 3), nullable=False, server_default=text("0"))
    tax = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    total_amount = Column(
        Numeric(14, 2),
        nullable=False,
        server_default=text("0"),
    )
    inventory_issue_id = Column(BigInteger)
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    invoice = relationship("ARInvoice", back_populates="items")


class ARTaxInvoice(Base):
    __tablename__ = "ar_tax_invoices"

    id = Column(BigInteger, primary_key=True, index=True)
    invoice_no = Column(String(50))
    invoice_date = Column(Date, nullable=False, server_default=text("CURRENT_DATE"))
    invoice_type = Column(String(20), nullable=False)
    dispatch_type = Column(String(20))
    oc_id = Column(BigInteger)
    proforma_invoice_id = Column(
        BigInteger,
        ForeignKey("ar_proforma_invoices.id"),
    )
    quotation_id = Column(BigInteger, ForeignKey("ar_quotations.id"))
    order_by = Column(String(150))
    asm = Column(String(150))
    order_approved_by = Column(String(150))
    eway_bill_no = Column(String(100))
    eway_bill_date = Column(Date)
    einvoice_details = Column(Text)
    isin_no = Column(String(100))
    einvoice_ack_no = Column(String(100))
    einvoice_ack_date = Column(DateTime)
    delivery_challan_no = Column(String(100))
    delivery_challan_date = Column(Date)
    consignee_customer_name = Column(String(200))
    consignee_street_number = Column(String(50))
    consignee_street_name = Column(String(255))
    consignee_city = Column(String(100))
    consignee_pin = Column(String(20))
    consignee_state = Column(String(100))
    consignee_country = Column(String(100))
    consignee_pan = Column(String(10))
    consignee_gstn = Column(String(15))
    buyer_customer_id = Column(BigInteger, ForeignKey("ar_customers.id"))
    buyer_customer_name = Column(String(200))
    buyer_street_number = Column(String(50))
    buyer_street_name = Column(String(255))
    buyer_city = Column(String(100))
    buyer_pin = Column(String(20))
    buyer_state = Column(String(100))
    buyer_country = Column(String(100))
    buyer_pan = Column(String(10))
    buyer_gstn = Column(String(15))
    purchase_order_no = Column(String(100))
    purchase_order_date = Column(Date)
    lr_no = Column(String(100))
    lr_date = Column(Date)
    terms_of_payment = Column(Text)
    terms_of_delivery = Column(Text)
    transporter = Column(String(200))
    vehicle_no = Column(String(50))
    total = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    amount_in_words = Column(Text)
    remarks = Column(Text)
    company_pan = Column(String(10))
    company_gstn = Column(String(15))
    company_cin = Column(String(30))
    bank_name = Column(String(150))
    bank_branch = Column(String(150))
    bank_account_no = Column(String(50))
    bank_ifsc = Column(String(11))
    company_name = Column(String(200))
    company_address = Column(Text)
    authorised_signatory = Column(String(200))
    generate_einvoice = Column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    generate_ewaybill = Column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    quotation = relationship("ARQuotation")
    proforma_invoice = relationship("ARProformaInvoice")
    buyer_customer = relationship("ARCustomer")
    items = relationship(
        "ARTaxInvoiceItem",
        back_populates="tax_invoice",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ARTaxInvoiceItem(Base):
    __tablename__ = "ar_tax_invoice_items"

    id = Column(BigInteger, primary_key=True, index=True)
    tax_invoice_id = Column(
        BigInteger,
        ForeignKey("ar_tax_invoices.id"),
        nullable=False,
    )
    sl_no = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    hsn = Column(String(20))
    quantity = Column(Numeric(14, 3), nullable=False, server_default=text("0"))
    rate = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    uom = Column(String(30))
    value = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    gst_rate = Column(Numeric(6, 3), nullable=False, server_default=text("0"))
    tax = Column(Numeric(14, 2), nullable=False, server_default=text("0"))
    total_amount = Column(
        Numeric(14, 2),
        nullable=False,
        server_default=text("0"),
    )
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    tax_invoice = relationship("ARTaxInvoice", back_populates="items")
