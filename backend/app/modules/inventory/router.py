import inspect
from typing import Any

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import DeclarativeBase, Session

from app.api.deps import get_db

from . import service
from .schemas import INVENTORY_MODELS, SCHEMAS


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


def _create_endpoint(
    model: type[DeclarativeBase],
    request_schema: type[BaseModel],
) -> Any:
    def endpoint(
        payload: Any,
        db: Session = Depends(get_db),
    ) -> DeclarativeBase:
        return service.create_record(
            db,
            model,
            payload.model_dump(exclude_unset=True),
        )

    _set_body_schema(endpoint, request_schema)
    return endpoint


def _set_body_schema(endpoint: Any, request_schema: type[BaseModel]) -> None:
    endpoint_signature = inspect.signature(endpoint)
    parameters = list(endpoint_signature.parameters.values())
    parameters[0] = parameters[0].replace(annotation=request_schema)
    setattr(
        endpoint,
        "__signature__",
        endpoint_signature.replace(parameters=parameters),
    )


def _list_endpoint(model: type[DeclarativeBase]) -> Any:
    def endpoint(db: Session = Depends(get_db)) -> list[DeclarativeBase]:
        return service.get_records(db, model)

    return endpoint


def _get_endpoint(model: type[DeclarativeBase]) -> Any:
    def endpoint(
        record_id: int,
        db: Session = Depends(get_db),
    ) -> DeclarativeBase:
        return service.get_record(db, model, record_id)

    return endpoint


def _update_endpoint(
    model: type[DeclarativeBase],
    request_schema: type[BaseModel],
) -> Any:
    def endpoint(
        record_id: int,
        payload: Any,
        db: Session = Depends(get_db),
    ) -> DeclarativeBase:
        return service.update_record(
            db,
            model,
            record_id,
            payload.model_dump(exclude_unset=True),
        )

    endpoint_signature = inspect.signature(endpoint)
    parameters = list(endpoint_signature.parameters.values())
    parameters[1] = parameters[1].replace(annotation=request_schema)
    setattr(
        endpoint,
        "__signature__",
        endpoint_signature.replace(parameters=parameters),
    )
    return endpoint


def _delete_endpoint(model: type[DeclarativeBase]) -> Any:
    def endpoint(record_id: int, db: Session = Depends(get_db)) -> Response:
        service.delete_record(db, model, record_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    return endpoint


RESOURCE_PATHS = {
    "inventory_unit_of_measures": "unit-of-measures",
    "inventory_stock_groups": "stock-groups",
    "inventory_stock_items": "stock-items",
    "inventory_indents": "indents",
    "inventory_indent_items": "indent-items",
    "inventory_gate_entries": "gate-entries",
    "inventory_gate_entry_items": "gate-entry-items",
    "inventory_material_receipt_notes": "material-receipt-notes",
    "inventory_material_receipt_note_items": "material-receipt-note-items",
    "inventory_delivery_challans": "delivery-challans",
    "inventory_delivery_challan_items": "delivery-challan-items",
    "inventory_delivery_challan_inwards": "delivery-challan-inwards",
    "inventory_delivery_challan_inward_items": "delivery-challan-inward-items",
    "inventory_goods_issues": "goods-issues",
    "inventory_goods_issue_items": "goods-issue-items",
    "inventory_goods_issue_sales": "goods-issue-sales",
    "inventory_goods_issue_sale_items": "goods-issue-sale-items",
}


for inventory_model in INVENTORY_MODELS:
    create_schema, update_schema, response_schema = SCHEMAS[inventory_model]
    resource_path = RESOURCE_PATHS[inventory_model.__tablename__]
    operation_prefix = resource_path.replace("-", "_")
    collection_path = f"/{resource_path}"
    record_path = f"{collection_path}/{{record_id}}"

    router.add_api_route(
        collection_path,
        _list_endpoint(inventory_model),
        methods=["GET"],
        response_model=list[response_schema],
        name=f"list_{operation_prefix}",
        operation_id=f"list_{operation_prefix}",
    )
    router.add_api_route(
        collection_path,
        _create_endpoint(inventory_model, create_schema),
        methods=["POST"],
        status_code=status.HTTP_201_CREATED,
        response_model=response_schema,
        name=f"create_{operation_prefix}",
        operation_id=f"create_{operation_prefix}",
    )
    router.add_api_route(
        record_path,
        _get_endpoint(inventory_model),
        methods=["GET"],
        response_model=response_schema,
        name=f"get_{operation_prefix}",
        operation_id=f"get_{operation_prefix}",
    )
    router.add_api_route(
        record_path,
        _update_endpoint(inventory_model, update_schema),
        methods=["PATCH"],
        response_model=response_schema,
        name=f"update_{operation_prefix}",
        operation_id=f"update_{operation_prefix}",
    )
    router.add_api_route(
        record_path,
        _delete_endpoint(inventory_model),
        methods=["DELETE"],
        status_code=status.HTTP_204_NO_CONTENT,
        response_model=None,
        name=f"delete_{operation_prefix}",
        operation_id=f"delete_{operation_prefix}",
    )