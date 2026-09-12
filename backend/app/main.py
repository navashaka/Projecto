"""FastAPI application entry point."""

from fastapi import FastAPI

from app.api.v1.router import router as api_v1_router
from app.core.database import Base, engine
from app.hr.recruitment.models import UserEnquiry  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Projecto API")


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(api_v1_router, prefix="/api/v1")
