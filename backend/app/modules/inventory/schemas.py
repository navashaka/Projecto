from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, create_model
from sqlalchemy import Column, Numeric, String
from sqlalchemy.orm import DeclarativeBase

from .models import (
    InventoryDeliveryChallan,
    InventoryDeliveryChallanInward,
    InventoryDeliveryChallanInwardItem,
    InventoryDeliveryChallanItem,
    InventoryGateEntry,
    InventoryGateEntryItem,
    InventoryGoodsIssue,
    InventoryGoodsIssueItem,
    InventoryGoodsIssueSale,
    InventoryGoodsIssueSaleItem,
    InventoryIndent,
    InventoryIndentItem,
    InventoryMaterialReceiptNote,
    InventoryMaterialReceiptNoteItem,
    InventoryStockGroup,
    InventoryStockItem,
    InventoryUnitOfMeasure,
)


INVENTORY_MODELS: tuple[type[DeclarativeBase], ...] = (
    InventoryUnitOfMeasure,
    InventoryStockGroup,
    InventoryStockItem,
    InventoryIndent,
    InventoryIndentItem,
    InventoryGateEntry,
    InventoryGateEntryItem,
    InventoryMaterialReceiptNote,
    InventoryMaterialReceiptNoteItem,
    InventoryDeliveryChallan,
    InventoryDeliveryChallanItem,
    InventoryDeliveryChallanInward,
    InventoryDeliveryChallanInwardItem,
    InventoryGoodsIssue,
    InventoryGoodsIssueItem,
    InventoryGoodsIssueSale,
    InventoryGoodsIssueSaleItem,
)


def _column_fields(
    columns: list[Column[Any]],
    *,
    update: bool = False,
    exclude_fields: set[str] | None = None,
    field_type_overrides: dict[str, Any] | None = None,
) -> dict[str, tuple[Any, Any]]:
    fields: dict[str, tuple[Any, Any]] = {}
    for column in columns:
        if (
            column.primary_key
            or column.name in {"created_at", "updated_at"}
            or (exclude_fields is not None and column.name in exclude_fields)
        ):
            continue

        field_type = column.type.python_type
        if column.nullable:
            field_type = field_type | None
        if field_type_overrides and column.name in field_type_overrides:
            field_type = field_type_overrides[column.name]

        if update or column.nullable:
            default = None
        elif column.default is not None or column.server_default is not None:
            default = None
        else:
            default = ...

        constraints: dict[str, Any] = {}
        if isinstance(column.type, String) and column.type.length is not None:
            constraints["max_length"] = column.type.length
        if isinstance(column.type, Numeric) and column.type.precision is not None:
            constraints["max_digits"] = column.type.precision
            constraints["decimal_places"] = column.type.scale or 0

        fields[column.name] = (
            field_type,
            Field(default=default, **constraints),
        )
    return fields


def _build_schemas(
    model: type[DeclarativeBase],
) -> tuple[type[BaseModel], type[BaseModel], type[BaseModel]]:
    columns = list(model.__table__.columns)
    config = ConfigDict(extra="forbid")
    create_schema = create_model(
        f"{model.__name__}Create",
        __config__=config,
        **_column_fields(
            columns,
            exclude_fields={
                column.name
                for column in columns
                if column.computed is not None
            },
            field_type_overrides=(
                {
                    "purpose": Literal["Delivery", "Jobwork"],
                    "status": Literal["Creation", "Checked", "Approved"],
                }
                if model is InventoryDeliveryChallan
                else None
            ),
        ),
    )

    update_schema = create_model(
        f"{model.__name__}Update",
        __config__=config,
        **_column_fields(columns, update=True),
    )
    response_schema = create_model(
        f"{model.__name__}Response",
        __config__=ConfigDict(from_attributes=True, extra="forbid"),
        **{
            column.name: (
                (
                    column.type.python_type | None
                    if column.nullable
                    else column.type.python_type
                ),
                Field(
                    ...,
                    **(
                        {"max_length": column.type.length}
                        if isinstance(column.type, String)
                        and column.type.length is not None
                        else {}
                    ),
                    **(
                        {
                            "max_digits": column.type.precision,
                            "decimal_places": column.type.scale or 0,
                        }
                        if isinstance(column.type, Numeric)
                        and column.type.precision is not None
                        else {}
                    ),
                ),
            )
            for column in columns
        },
    )
    return create_schema, update_schema, response_schema


SCHEMAS = {model: _build_schemas(model) for model in INVENTORY_MODELS}
