import inspect
from typing import Any

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import DeclarativeBase, Session

from app.api.deps import get_db

from . import service
from .schemas import AR_MODELS, AR_RESOURCES, SCHEMAS


router = APIRouter(prefix="/ar", tags=["Accounts Receivable"])

EWAY_BILL_URL = "https://ewaybillgst.gov.in/Login.aspx"


def _with_body_schema(
    endpoint: Any,
    request_schema: type[BaseModel],
    body_parameter: int,
) -> Any:
    signature = inspect.signature(endpoint)
    parameters = list(signature.parameters.values())

    parameters[body_parameter] = parameters[body_parameter].replace(
        annotation=request_schema,
    )

    endpoint.__signature__ = signature.replace(parameters=parameters)
    return endpoint


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

    return _with_body_schema(endpoint, request_schema, 0)


def _list_endpoint(model: type[DeclarativeBase]) -> Any:
    def endpoint(
        db: Session = Depends(get_db),
    ) -> list[DeclarativeBase]:
        return service.get_all_records(db, model)

    return endpoint


def _get_endpoint(model: type[DeclarativeBase]) -> Any:
    def endpoint(
        record_id: int,
        db: Session = Depends(get_db),
    ) -> DeclarativeBase:
        return service.get_record_by_id(db, model, record_id)

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

    return _with_body_schema(endpoint, request_schema, 1)


def _delete_endpoint(model: type[DeclarativeBase]) -> Any:
    def endpoint(
        record_id: int,
        db: Session = Depends(get_db),
    ) -> Response:
        service.delete_record(db, model, record_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    return endpoint


@router.get("/")
def ar_root() -> dict[str, list[str]]:
    return {"resources": list(AR_RESOURCES.values())}


@router.get("/eway-bill-url", name="get_ar_eway_bill_url")
def get_eway_bill_url() -> dict[str, str]:
    return {"eway_bill_url": EWAY_BILL_URL}


for ar_model in AR_MODELS:
    create_schema, update_schema, response_schema = SCHEMAS[ar_model]

    resource_path = AR_RESOURCES[ar_model]
    operation_prefix = resource_path.replace("-", "_")
    collection_path = f"/{resource_path}"
    record_path = f"{collection_path}/{{record_id}}"

    router.add_api_route(
        collection_path,
        _list_endpoint(ar_model),
        methods=["GET"],
        response_model=list[response_schema],
        name=f"list_{operation_prefix}",
        operation_id=f"list_ar_{operation_prefix}",
    )

    router.add_api_route(
        collection_path,
        _create_endpoint(ar_model, create_schema),
        methods=["POST"],
        status_code=status.HTTP_201_CREATED,
        response_model=response_schema,
        name=f"create_{operation_prefix}",
        operation_id=f"create_ar_{operation_prefix}",
    )

    router.add_api_route(
        record_path,
        _get_endpoint(ar_model),
        methods=["GET"],
        response_model=response_schema,
        name=f"get_{operation_prefix}",
        operation_id=f"get_ar_{operation_prefix}",
    )

    router.add_api_route(
        record_path,
        _update_endpoint(ar_model, update_schema),
        methods=["PATCH"],
        response_model=response_schema,
        name=f"update_{operation_prefix}",
        operation_id=f"update_ar_{operation_prefix}",
    )

    router.add_api_route(
        record_path,
        _delete_endpoint(ar_model),
        methods=["DELETE"],
        status_code=status.HTTP_204_NO_CONTENT,
        response_model=None,
        name=f"delete_{operation_prefix}",
        operation_id=f"delete_ar_{operation_prefix}",
    )