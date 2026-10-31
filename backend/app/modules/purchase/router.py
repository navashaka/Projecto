from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.purchase import models, schemas, service

router = APIRouter(prefix="/purchase", tags=["Purchase"])


def create_item(db, model, payload):
    return service.create(db, model, payload.dict())


def update_item(db, model, record_id, payload):
    record = service.get_by_id(db, model, record_id)

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    return service.update(
        db,
        record,
        payload.dict(exclude_unset=True),
    )


def delete_item(db, model, record_id):
    record = service.get_by_id(db, model, record_id)

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    service.delete(db, record)
    return {"message": "Record deleted successfully"}


# ---------------- VENDOR CREATION ----------------

@router.post("/vendors", response_model=schemas.VendorResponse)
def create_vendor(payload: schemas.VendorCreate, db: Session = Depends(get_db)):
    return create_item(db, models.PurchaseVendorCreation, payload)


@router.get("/vendors", response_model=list[schemas.VendorResponse])
def get_vendors(db: Session = Depends(get_db)):
    return service.get_all(db, models.PurchaseVendorCreation)


@router.get("/vendors/{record_id}", response_model=schemas.VendorResponse)
def get_vendor(record_id: int, db: Session = Depends(get_db)):
    record = service.get_by_id(db, models.PurchaseVendorCreation, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return record


@router.put("/vendors/{record_id}", response_model=schemas.VendorResponse)
def update_vendor(
    record_id: int,
    payload: schemas.VendorUpdate,
    db: Session = Depends(get_db),
):
    return update_item(db, models.PurchaseVendorCreation, record_id, payload)


@router.delete("/vendors/{record_id}")
def delete_vendor(record_id: int, db: Session = Depends(get_db)):
    return delete_item(db, models.PurchaseVendorCreation, record_id)


# ---------------- QUOTATION COMPARISON ----------------

@router.post(
    "/quotation-comparisons",
    response_model=schemas.QuotationComparisonResponse,
)
def create_quotation_comparison(
    payload: schemas.QuotationComparisonCreate,
    db: Session = Depends(get_db),
):
    return create_item(db, models.PurchaseQuotationComparison, payload)


@router.get(
    "/quotation-comparisons",
    response_model=list[schemas.QuotationComparisonResponse],
)
def get_quotation_comparisons(db: Session = Depends(get_db)):
    return service.get_all(db, models.PurchaseQuotationComparison)


@router.get(
    "/quotation-comparisons/{record_id}",
    response_model=schemas.QuotationComparisonResponse,
)
def get_quotation_comparison(record_id: int, db: Session = Depends(get_db)):
    record = service.get_by_id(
        db, models.PurchaseQuotationComparison, record_id
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.put(
    "/quotation-comparisons/{record_id}",
    response_model=schemas.QuotationComparisonResponse,
)
def update_quotation_comparison(
    record_id: int,
    payload: schemas.QuotationComparisonUpdate,
    db: Session = Depends(get_db),
):
    return update_item(
        db, models.PurchaseQuotationComparison, record_id, payload
    )


@router.delete("/quotation-comparisons/{record_id}")
def delete_quotation_comparison(
    record_id: int,
    db: Session = Depends(get_db),
):
    return delete_item(
        db, models.PurchaseQuotationComparison, record_id
    )


# ---------------- PURCHASE ORDER ----------------

@router.post("/orders", response_model=schemas.PurchaseOrderResponse)
def create_purchase_order(
    payload: schemas.PurchaseOrderCreate,
    db: Session = Depends(get_db),
):
    return create_item(db, models.PurchaseOrder, payload)


@router.get("/orders", response_model=list[schemas.PurchaseOrderResponse])
def get_purchase_orders(db: Session = Depends(get_db)):
    return service.get_all(db, models.PurchaseOrder)


@router.get("/orders/{record_id}", response_model=schemas.PurchaseOrderResponse)
def get_purchase_order(record_id: int, db: Session = Depends(get_db)):
    record = service.get_by_id(db, models.PurchaseOrder, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return record


@router.put("/orders/{record_id}", response_model=schemas.PurchaseOrderResponse)
def update_purchase_order(
    record_id: int,
    payload: schemas.PurchaseOrderUpdate,
    db: Session = Depends(get_db),
):
    return update_item(db, models.PurchaseOrder, record_id, payload)


@router.delete("/orders/{record_id}")
def delete_purchase_order(record_id: int, db: Session = Depends(get_db)):
    return delete_item(db, models.PurchaseOrder, record_id)


# ---------------- ADVANCE REQUISITION ----------------

@router.post(
    "/advance-requisitions",
    response_model=schemas.AdvanceRequisitionResponse,
)
def create_advance_requisition(
    payload: schemas.AdvanceRequisitionCreate,
    db: Session = Depends(get_db),
):
    return create_item(db, models.PurchaseAdvanceRequisition, payload)


@router.get(
    "/advance-requisitions",
    response_model=list[schemas.AdvanceRequisitionResponse],
)
def get_advance_requisitions(db: Session = Depends(get_db)):
    return service.get_all(db, models.PurchaseAdvanceRequisition)


@router.get(
    "/advance-requisitions/{record_id}",
    response_model=schemas.AdvanceRequisitionResponse,
)
def get_advance_requisition(record_id: int, db: Session = Depends(get_db)):
    record = service.get_by_id(
        db, models.PurchaseAdvanceRequisition, record_id
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.put(
    "/advance-requisitions/{record_id}",
    response_model=schemas.AdvanceRequisitionResponse,
)
def update_advance_requisition(
    record_id: int,
    payload: schemas.AdvanceRequisitionUpdate,
    db: Session = Depends(get_db),
):
    return update_item(
        db, models.PurchaseAdvanceRequisition, record_id, payload
    )


@router.delete("/advance-requisitions/{record_id}")
def delete_advance_requisition(
    record_id: int,
    db: Session = Depends(get_db),
):
    return delete_item(
        db, models.PurchaseAdvanceRequisition, record_id
    )