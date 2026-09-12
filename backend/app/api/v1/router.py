from fastapi import APIRouter

try:
    from app.hr.employees.router import router as employees_router
except ImportError:  # pragma: no cover - optional module during migration
    employees_router = None

from app.hr.recruitment.router import router as recruitment_router

router = APIRouter()

if employees_router is not None:
    router.include_router(employees_router)
router.include_router(recruitment_router)
