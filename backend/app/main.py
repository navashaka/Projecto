from fastapi import FastAPI

from app.api.v1.users import router as users_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.travelling_advance import router as travelling_advance_router
from app.api.v1.salary_details import router as salary_details_router
from app.api.v1.job_profile import router as job_profile_router

app = FastAPI(title="Projecto API")

app.include_router(users_router, prefix="/api/v1")
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(travelling_advance_router, prefix="/api/v1")
app.include_router(salary_details_router, prefix="/api/v1")
app.include_router(job_profile_router, prefix="/api/v1")