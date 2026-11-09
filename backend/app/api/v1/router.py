from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.purchases import router as purchases_router
from app.modules.bank.router import router as bank_router

try:
    from app.hr.employees.router import router as employees_router
except ImportError:  # pragma: no cover - optional module during migration
    employees_router = None

from app.hr.recruitment.router import router as recruitment_router
from app.hr.forms.router import router as hr_forms_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(purchases_router)
router.include_router(bank_router)
if employees_router is not None:
    router.include_router(employees_router)
router.include_router(recruitment_router)
router.include_router(hr_forms_router)
