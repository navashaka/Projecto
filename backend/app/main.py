"""FastAPI application entry point."""

from fastapi import FastAPI

from app.api.v1.users import router as users_router
from app.api.v1.attendance import router as attendance_router


app = FastAPI(title="Projecto API")


app.include_router(users_router, prefix="/api/v1")
app.include_router(attendance_router, prefix="/api/v1")