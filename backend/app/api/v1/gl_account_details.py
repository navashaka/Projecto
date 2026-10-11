from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.gl_account_details import (
    GLSecuredLoan,
    GLSundryCreditor,
    GLSundryDebtor,
    GLUnsecuredLoan,
)
from app.schemas.gl_account_details import (
    GLSecuredLoanCreate,
    GLSecuredLoanResponse,
    GLSundryCreditorCreate,
    GLSundryCreditorResponse,
    GLSundryDebtorCreate,
    GLSundryDebtorResponse,
    GLUnsecuredLoanCreate,
    GLUnsecuredLoanResponse,
)
from app.services.gl_account_details_service import (
    create_account_detail,
    delete_account_detail,
    get_account_detail,
    get_account_details,
    update_account_detail,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


gl_sundry_creditors_router = APIRouter(
    prefix="/gl-sundry-creditors",
    tags=["GL Sundry Creditors"],
)
gl_sundry_debtors_router = APIRouter(
    prefix="/gl-sundry-debtors",
    tags=["GL Sundry Debtors"],
)
gl_secured_loans_router = APIRouter(
    prefix="/gl-secured-loans",
    tags=["GL Secured Loans"],
)
gl_unsecured_loans_router = APIRouter(
    prefix="/gl-unsecured-loans",
    tags=["GL Unsecured Loans"],
)


@gl_sundry_creditors_router.post("/", response_model=GLSundryCreditorResponse)
def create_sundry_creditor(
    data: GLSundryCreditorCreate,
    db: Session = Depends(get_db),
):
    return create_account_detail(db, GLSundryCreditor, data)


@gl_sundry_creditors_router.get("/", response_model=list[GLSundryCreditorResponse])
def get_sundry_creditors(db: Session = Depends(get_db)):
    return get_account_details(db, GLSundryCreditor)


@gl_sundry_creditors_router.get(
    "/{record_id}",
    response_model=GLSundryCreditorResponse,
)
def get_sundry_creditor(
    record_id: int,
    db: Session = Depends(get_db),
):
    record = get_account_detail(db, GLSundryCreditor, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="GL Sundry Creditor not found.")
    return record


@gl_sundry_creditors_router.put(
    "/{record_id}",
    response_model=GLSundryCreditorResponse,
)
def update_sundry_creditor(
    record_id: int,
    data: GLSundryCreditorCreate,
    db: Session = Depends(get_db),
):
    record = update_account_detail(
        db,
        GLSundryCreditor,
        record_id,
        data,
    )
    if record is None:
        raise HTTPException(status_code=404, detail="GL Sundry Creditor not found.")
    return record


@gl_sundry_creditors_router.delete("/{record_id}")
def delete_sundry_creditor(
    record_id: int,
    db: Session = Depends(get_db),
):
    if not delete_account_detail(db, GLSundryCreditor, record_id):
        raise HTTPException(status_code=404, detail="GL Sundry Creditor not found.")
    return {"message": "GL Sundry Creditor deleted successfully."}


@gl_sundry_debtors_router.post("/", response_model=GLSundryDebtorResponse)
def create_sundry_debtor(
    data: GLSundryDebtorCreate,
    db: Session = Depends(get_db),
):
    return create_account_detail(db, GLSundryDebtor, data)


@gl_sundry_debtors_router.get("/", response_model=list[GLSundryDebtorResponse])
def get_sundry_debtors(db: Session = Depends(get_db)):
    return get_account_details(db, GLSundryDebtor)


@gl_sundry_debtors_router.get(
    "/{record_id}",
    response_model=GLSundryDebtorResponse,
)
def get_sundry_debtor(
    record_id: int,
    db: Session = Depends(get_db),
):
    record = get_account_detail(db, GLSundryDebtor, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="GL Sundry Debtor not found.")
    return record


@gl_sundry_debtors_router.put(
    "/{record_id}",
    response_model=GLSundryDebtorResponse,
)
def update_sundry_debtor(
    record_id: int,
    data: GLSundryDebtorCreate,
    db: Session = Depends(get_db),
):
    record = update_account_detail(
        db,
        GLSundryDebtor,
        record_id,
        data,
    )
    if record is None:
        raise HTTPException(status_code=404, detail="GL Sundry Debtor not found.")
    return record


@gl_sundry_debtors_router.delete("/{record_id}")
def delete_sundry_debtor(
    record_id: int,
    db: Session = Depends(get_db),
):
    if not delete_account_detail(db, GLSundryDebtor, record_id):
        raise HTTPException(status_code=404, detail="GL Sundry Debtor not found.")
    return {"message": "GL Sundry Debtor deleted successfully."}


@gl_secured_loans_router.post("/", response_model=GLSecuredLoanResponse)
def create_secured_loan(
    data: GLSecuredLoanCreate,
    db: Session = Depends(get_db),
):
    return create_account_detail(db, GLSecuredLoan, data)


@gl_secured_loans_router.get("/", response_model=list[GLSecuredLoanResponse])
def get_secured_loans(db: Session = Depends(get_db)):
    return get_account_details(db, GLSecuredLoan)


@gl_secured_loans_router.get(
    "/{record_id}",
    response_model=GLSecuredLoanResponse,
)
def get_secured_loan(
    record_id: int,
    db: Session = Depends(get_db),
):
    record = get_account_detail(db, GLSecuredLoan, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="GL Secured Loan not found.")
    return record


@gl_secured_loans_router.put(
    "/{record_id}",
    response_model=GLSecuredLoanResponse,
)
def update_secured_loan(
    record_id: int,
    data: GLSecuredLoanCreate,
    db: Session = Depends(get_db),
):
    record = update_account_detail(db, GLSecuredLoan, record_id, data)
    if record is None:
        raise HTTPException(status_code=404, detail="GL Secured Loan not found.")
    return record


@gl_secured_loans_router.delete("/{record_id}")
def delete_secured_loan(
    record_id: int,
    db: Session = Depends(get_db),
):
    if not delete_account_detail(db, GLSecuredLoan, record_id):
        raise HTTPException(status_code=404, detail="GL Secured Loan not found.")
    return {"message": "GL Secured Loan deleted successfully."}


@gl_unsecured_loans_router.post("/", response_model=GLUnsecuredLoanResponse)
def create_unsecured_loan(
    data: GLUnsecuredLoanCreate,
    db: Session = Depends(get_db),
):
    return create_account_detail(db, GLUnsecuredLoan, data)


@gl_unsecured_loans_router.get("/", response_model=list[GLUnsecuredLoanResponse])
def get_unsecured_loans(db: Session = Depends(get_db)):
    return get_account_details(db, GLUnsecuredLoan)


@gl_unsecured_loans_router.get(
    "/{record_id}",
    response_model=GLUnsecuredLoanResponse,
)
def get_unsecured_loan(
    record_id: int,
    db: Session = Depends(get_db),
):
    record = get_account_detail(db, GLUnsecuredLoan, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="GL Unsecured Loan not found.")
    return record


@gl_unsecured_loans_router.put(
    "/{record_id}",
    response_model=GLUnsecuredLoanResponse,
)
def update_unsecured_loan(
    record_id: int,
    data: GLUnsecuredLoanCreate,
    db: Session = Depends(get_db),
):
    record = update_account_detail(db, GLUnsecuredLoan, record_id, data)
    if record is None:
        raise HTTPException(status_code=404, detail="GL Unsecured Loan not found.")
    return record


@gl_unsecured_loans_router.delete("/{record_id}")
def delete_unsecured_loan(
    record_id: int,
    db: Session = Depends(get_db),
):
    if not delete_account_detail(db, GLUnsecuredLoan, record_id):
        raise HTTPException(status_code=404, detail="GL Unsecured Loan not found.")
    return {"message": "GL Unsecured Loan deleted successfully."}
