from sqlalchemy import (
    Boolean,
    Column,
    Computed,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Time,
    text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class InventoryUnitOfMeasure(Base):
    __tablename__ = "inventory_unit_of_measures"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    number_of_decimals = Column(
        Numeric(2, 1),
        nullable=False,
        server_default=text("0"),
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

    stock_items = relationship(
        "InventoryStockItem",
        back_populates="unit_of_measure",
    )


class InventoryStockGroup(Base):
    __tablename__ = "inventory_stock_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)

    under_stock_group_id = Column(
        Integer,
        ForeignKey(
            "inventory_stock_groups.id",
            ondelete="SET NULL",
        ),
        nullable=True,
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

    parent = relationship(
        "InventoryStockGroup",
        remote_side=[id],
        backref="child_groups",
    )
    stock_items = relationship(
        "InventoryStockItem",
        back_populates="stock_group",
    )


class InventoryStockItem(Base):
    __tablename__ = "inventory_stock_items"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(200),
        nullable=False,
    )

    unit_of_measure_id = Column(
        Integer,
        ForeignKey("inventory_unit_of_measures.id"),
        nullable=False,
    )

    stock_group_id = Column(
        Integer,
        ForeignKey("inventory_stock_groups.id"),
        nullable=False,
    )

    select_costing = Column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )

    gl_account_id = Column(
        Integer,
        ForeignKey("gl_accounts.id"),
        nullable=True,
    )

    hsn_master_id = Column(
        Integer,
        ForeignKey("gl_hsn_master.id"),
        nullable=True,
    )

    sac_master_id = Column(
        Integer,
        ForeignKey("gl_sac_master.id"),
        nullable=True,
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

    unit_of_measure = relationship(
        "InventoryUnitOfMeasure",
        back_populates="stock_items",
    )
    stock_group = relationship(
        "InventoryStockGroup",
        back_populates="stock_items",
    )


class InventoryIndent(Base):
    __tablename__ = "inventory_indents"

    id = Column(Integer, primary_key=True, index=True)

    indent_no = Column(
        String(50),
        nullable=False,
        unique=True,
    )

    indent_date = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    department_id = Column(
        Integer,
        nullable=True,
    )

    status = Column(
        String(20),
        nullable=False,
        server_default=text("'Creation'"),
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

    items = relationship(
        "InventoryIndentItem",
        back_populates="indent",
        cascade="all, delete-orphan",
    )


class InventoryIndentItem(Base):
    __tablename__ = "inventory_indent_items"

    id = Column(Integer, primary_key=True, index=True)

    indent_id = Column(
        Integer,
        ForeignKey(
            "inventory_indents.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    stock_item_id = Column(
        Integer,
        ForeignKey(
            "inventory_stock_items.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    quantity = Column(
        Numeric(12, 3),
        nullable=False,
        server_default=text("0"),
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

    indent = relationship(
        "InventoryIndent",
        back_populates="items",
    )


class InventoryGateEntry(Base):
    __tablename__ = "inventory_gate_entries"

    id = Column(Integer, primary_key=True, index=True)

    gate_entry_no = Column(
        String(50),
        nullable=False,
        server_default=Computed(
            "'GE-' || LPAD(id::TEXT, 6, '0')",
            persisted=True,
        ),
    )

    entry_date = Column(
        Date,
        nullable=False,
        server_default=text("CURRENT_DATE"),
    )

    entry_time = Column(
        Time,
        nullable=False,
        server_default=text("CURRENT_TIME"),
    )

    vendor_invoice_no = Column(
        String(100),
        nullable=True,
    )

    vendor_invoice_date = Column(
        Date,
        nullable=True,
    )

    vendor_name = Column(
        String(200),
        nullable=True,
    )

    vendor_address = Column(
        String(500),
        nullable=True,
    )

    transporter_name = Column(
        String(200),
        nullable=True,
    )

    vehicle_no = Column(
        String(50),
        nullable=True,
    )

    status = Column(
        String(20),
        nullable=False,
        server_default=text("'Creation'"),
    )

    scan_copy_path = Column(
        String(500),
        nullable=True,
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

    items = relationship(
        "InventoryGateEntryItem",
        back_populates="gate_entry",
        cascade="all, delete-orphan",
    )


class InventoryGateEntryItem(Base):
    __tablename__ = "inventory_gate_entry_items"

    id = Column(Integer, primary_key=True, index=True)

    gate_entry_id = Column(
        Integer,
        ForeignKey(
            "inventory_gate_entries.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    stock_item_id = Column(
        Integer,
        ForeignKey(
            "inventory_stock_items.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    quantity = Column(
        Numeric(12, 3),
        nullable=False,
        server_default=text("0"),
    )

    rate = Column(
        Numeric(15, 2),
        nullable=False,
        server_default=text("0"),
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

    gate_entry = relationship(
        "InventoryGateEntry",
        back_populates="items",
    )


class InventoryMaterialReceiptNote(Base):
    __tablename__ = "inventory_material_receipt_notes"

    id = Column(Integer, primary_key=True, index=True)

    mrn_no = Column(
        String(50),
        nullable=False,
        unique=True,
    )

    mrn_date = Column(
        Date,
        nullable=False,
        server_default=text("CURRENT_DATE"),
    )

    mrn_time = Column(
        Time,
        nullable=False,
        server_default=text("CURRENT_TIME"),
    )

    gate_entry_id = Column(
        Integer,
        ForeignKey(
            "inventory_gate_entries.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    purchase_order_no = Column(
        String(100),
        nullable=True,
    )

    purchase_order_date = Column(
        Date,
        nullable=True,
    )

    vendor_invoice_no = Column(
        String(100),
        nullable=True,
    )

    vendor_invoice_date = Column(
        Date,
        nullable=True,
    )

    vendor_name = Column(
        String(200),
        nullable=True,
    )

    vendor_address = Column(
        String(500),
        nullable=True,
    )

    eway_bill_no = Column(
        String(100),
        nullable=True,
    )

    eway_bill_date = Column(
        Date,
        nullable=True,
    )

    transporter_name = Column(
        String(200),
        nullable=True,
    )

    vehicle_no = Column(
        String(50),
        nullable=True,
    )

    status = Column(
        String(20),
        nullable=False,
        server_default=text("'Creation'"),
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

    items = relationship(
        "InventoryMaterialReceiptNoteItem",
        back_populates="mrn",
        cascade="all, delete-orphan",
    )


class InventoryMaterialReceiptNoteItem(Base):
    __tablename__ = "inventory_material_receipt_note_items"

    id = Column(Integer, primary_key=True, index=True)

    mrn_id = Column(
        Integer,
        ForeignKey(
            "inventory_material_receipt_notes.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    gate_entry_item_id = Column(
        Integer,
        ForeignKey(
            "inventory_gate_entry_items.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    stock_item_id = Column(
        Integer,
        ForeignKey(
            "inventory_stock_items.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    quantity = Column(
        Numeric(12, 3),
        nullable=False,
        server_default=text("0"),
    )

    rate = Column(
        Numeric(15, 2),
        nullable=False,
        server_default=text("0"),
    )

    costing_purpose = Column(
        String(100),
        nullable=True,
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

    mrn = relationship(
        "InventoryMaterialReceiptNote",
        back_populates="items",
    )


class InventoryDeliveryChallan(Base):
    __tablename__ = "inventory_delivery_challans"

    id = Column(Integer, primary_key=True, index=True)

    delivery_challan_no = Column(
        String(50),
        nullable=False,
        server_default=Computed(
            "'DC-' || LPAD(id::TEXT, 6, '0')",
            persisted=True,
        ),
    )

    delivery_challan_date = Column(
        Date,
        nullable=False,
        server_default=text("CURRENT_DATE"),
    )

    purpose = Column(
        String(50),
        nullable=False,
    )

    transporter_name = Column(
        String(200),
        nullable=True,
    )

    vehicle_no = Column(
        String(50),
        nullable=True,
    )

    eway_bill_required = Column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )

    eway_bill_no = Column(
        String(100),
        nullable=True,
    )

    eway_bill_date = Column(
        Date,
        nullable=True,
    )

    status = Column(
        String(20),
        nullable=False,
        server_default=text("'Creation'"),
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

    items = relationship(
        "InventoryDeliveryChallanItem",
        back_populates="delivery_challan",
        cascade="all, delete-orphan",
    )


class InventoryDeliveryChallanItem(Base):
    __tablename__ = "inventory_delivery_challan_items"

    id = Column(Integer, primary_key=True, index=True)

    delivery_challan_id = Column(
        Integer,
        ForeignKey(
            "inventory_delivery_challans.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    stock_item_id = Column(
        Integer,
        ForeignKey(
            "inventory_stock_items.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    quantity = Column(
        Numeric(12, 3),
        nullable=False,
        server_default=text("0"),
    )

    rate = Column(
        Numeric(15, 2),
        nullable=False,
        server_default=text("0"),
    )

    gst = Column(
        Numeric(5, 2),
        nullable=False,
        server_default=text("0"),
    )

    vendor_invoice_no = Column(
        String(100),
        nullable=True,
    )

    vendor_invoice_date = Column(
        Date,
        nullable=True,
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

    delivery_challan = relationship(
        "InventoryDeliveryChallan",
        back_populates="items",
    )


class InventoryDeliveryChallanInward(Base):
    __tablename__ = "inventory_delivery_challan_inwards"

    id = Column(Integer, primary_key=True, index=True)

    delivery_challan_no = Column(
        String(50),
        nullable=False,
        server_default=Computed(
            "'DCI-' || LPAD(id::TEXT, 6, '0')",
            persisted=True,
        ),
    )

    delivery_challan_date = Column(
        Date,
        nullable=False,
        server_default=text("CURRENT_DATE"),
    )

    purpose = Column(
        String(50),
        nullable=False,
    )

    job_worker = Column(
        String(200),
        nullable=True,
    )

    address = Column(
        String(500),
        nullable=True,
    )

    work_order_no = Column(
        String(100),
        nullable=True,
    )

    work_order_date = Column(
        Date,
        nullable=True,
    )

    transporter_name = Column(
        String(200),
        nullable=True,
    )

    vehicle_no = Column(
        String(50),
        nullable=True,
    )

    eway_bill_required = Column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )

    eway_bill_no = Column(
        String(100),
        nullable=True,
    )

    eway_bill_date = Column(
        Date,
        nullable=True,
    )

    status = Column(
        String(20),
        nullable=False,
        server_default=text("'Creation'"),
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

    items = relationship(
        "InventoryDeliveryChallanInwardItem",
        back_populates="challan",
        cascade="all, delete-orphan",
    )


class InventoryDeliveryChallanInwardItem(Base):
    __tablename__ = "inventory_delivery_challan_inward_items"

    id = Column(Integer, primary_key=True, index=True)

    delivery_challan_inward_id = Column(
        Integer,
        ForeignKey(
            "inventory_delivery_challan_inwards.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    stock_item_id = Column(
        Integer,
        ForeignKey(
            "inventory_stock_items.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    quantity = Column(
        Numeric(12, 3),
        nullable=False,
        server_default=text("0"),
    )

    rate = Column(
        Numeric(15, 2),
        nullable=False,
        server_default=text("0"),
    )

    gst = Column(
        Numeric(5, 2),
        nullable=False,
        server_default=text("0"),
    )

    vendor_invoice_no = Column(
        String(100),
        nullable=True,
    )

    vendor_invoice_date = Column(
        Date,
        nullable=True,
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

    challan = relationship(
        "InventoryDeliveryChallanInward",
        back_populates="items",
    )


class InventoryGoodsIssue(Base):
    __tablename__ = "inventory_goods_issues"

    id = Column(Integer, primary_key=True, index=True)

    indent_id = Column(
        Integer,
        ForeignKey(
            "inventory_indents.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    indent_date = Column(
        Date,
        nullable=True,
    )

    department_id = Column(
        Integer,
        nullable=True,
    )

    status = Column(
        String(30),
        nullable=False,
        server_default=text("'Created'"),
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

    items = relationship(
        "InventoryGoodsIssueItem",
        back_populates="goods_issue",
        cascade="all, delete-orphan",
    )


class InventoryGoodsIssueItem(Base):
    __tablename__ = "inventory_goods_issue_items"

    id = Column(Integer, primary_key=True, index=True)

    goods_issue_id = Column(
        Integer,
        ForeignKey(
            "inventory_goods_issues.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    stock_item_id = Column(
        Integer,
        ForeignKey(
            "inventory_stock_items.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    quantity = Column(
        Numeric(12, 3),
        nullable=False,
    )

    cost_element_id = Column(
        Integer,
        nullable=True,
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

    goods_issue = relationship(
        "InventoryGoodsIssue",
        back_populates="items",
    )


class InventoryGoodsIssueSale(Base):
    __tablename__ = "inventory_goods_issue_sales"

    id = Column(Integer, primary_key=True, index=True)

    sale_order_id = Column(
        Integer,
        nullable=True,
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

    items = relationship(
        "InventoryGoodsIssueSaleItem",
        back_populates="goods_issue_sale",
        cascade="all, delete-orphan",
    )


class InventoryGoodsIssueSaleItem(Base):
    __tablename__ = "inventory_goods_issue_sale_items"

    id = Column(Integer, primary_key=True, index=True)

    goods_issue_sale_id = Column(
        Integer,
        ForeignKey(
            "inventory_goods_issue_sales.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    stock_item_id = Column(
        Integer,
        ForeignKey(
            "inventory_stock_items.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    quantity = Column(
        Numeric(12, 3),
        nullable=False,
    )

    cost_element_id = Column(
        Integer,
        nullable=False,
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

    goods_issue_sale = relationship(
        "InventoryGoodsIssueSale",
        back_populates="items",
    )