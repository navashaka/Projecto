from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.users import router as users_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.travelling_advance import router as travelling_advance_router
from app.api.v1.salary_details import router as salary_details_router
from app.api.v1.job_profile import router as job_profile_router
from app.api.v1.on_employment import router as on_employment_router
from app.api.v1.employment import router as employment_router
from app.api.v1.travelling_expenses_reimbursement import (
    router as travelling_expenses_reimbursement_router,
)

from app.api.v1.router import router as api_v1_router
from app.core.database import Base, engine
from app.hr.recruitment.models import UserEnquiry  # noqa: F401


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Projecto API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(users_router, prefix="/api/v1")
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(travelling_advance_router, prefix="/api/v1")
app.include_router(salary_details_router, prefix="/api/v1")
app.include_router(job_profile_router, prefix="/api/v1")
app.include_router(on_employment_router, prefix="/api/v1")
app.include_router(employment_router, prefix="/api/v1")
app.include_router(
    travelling_expenses_reimbursement_router,
    prefix="/api/v1",
)
app.include_router(api_v1_router, prefix="/api/v1")