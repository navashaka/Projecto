from fastapi import APIRouter

from app.api.v1.auth import router as auth_router

try:
    from app.hr.employees.router import router as employees_router
except ImportError:  # pragma: no cover - optional module during migration
    employees_router = None

from app.hr.recruitment.router import router as recruitment_router

router = APIRouter()

router.include_router(auth_router)
if employees_router is not None:
    router.include_router(employees_router)
router.include_router(recruitment_router)
