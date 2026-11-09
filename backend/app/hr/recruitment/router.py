from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.hr.recruitment.schemas import UserEnquiryCreate, UserEnquiryRead
from app.hr.recruitment.service import UserEnquiryService

router = APIRouter(prefix="/user-enquiries", tags=["user-enquiries"])
UPLOAD_DIRECTORY = Path(__file__).resolve().parents[3] / "uploads" / "hr" / "candidate-enquiry"
MAX_UPLOAD_SIZE = 10 * 1024 * 1024
ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"}


@router.post("/uploads", status_code=status.HTTP_201_CREATED)
async def upload_candidate_document(file: UploadFile = File(...)) -> dict[str, str]:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported document type.",
        )
    contents = await file.read(MAX_UPLOAD_SIZE + 1)
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Document exceeds the 10 MB limit.",
        )
    stored_name = f"{uuid4().hex}{extension}"
    UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIRECTORY / stored_name).write_bytes(contents)
    return {"path": f"/api/v1/user-enquiries/uploads/{stored_name}"}


@router.get("/uploads/{file_name}", include_in_schema=False)
def get_candidate_document(file_name: str) -> FileResponse:
    if Path(file_name).name != file_name or Path(file_name).suffix.lower() not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    path = UPLOAD_DIRECTORY / file_name
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return FileResponse(path)


@router.post("/", response_model=UserEnquiryRead, status_code=status.HTTP_201_CREATED)
def create_user_enquiry(payload: UserEnquiryCreate, db: Session = Depends(get_db)):
    return UserEnquiryService.create_enquiry(db, payload)


@router.put("/{enquiry_id}", response_model=UserEnquiryRead)
def update_user_enquiry(
    enquiry_id: int,
    payload: UserEnquiryCreate,
    db: Session = Depends(get_db),
):
    enquiry = UserEnquiryService.update_enquiry(db, enquiry_id, payload)
    if not enquiry:
        raise HTTPException(status_code=404, detail="User enquiry not found")
    return enquiry


@router.get("/", response_model=list[UserEnquiryRead])
def list_user_enquiries(db: Session = Depends(get_db)):
    return UserEnquiryService.get_enquiries(db)


@router.get("/{enquiry_id}", response_model=UserEnquiryRead)
def get_user_enquiry(enquiry_id: int, db: Session = Depends(get_db)):
    enquiry = UserEnquiryService.get_enquiry(db, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail="User enquiry not found")
    return enquiry
