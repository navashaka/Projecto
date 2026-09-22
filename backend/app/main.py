from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.users import router as users_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.attendance_coe import router as attendance_coe_router
from app.api.v1.company_holidays import (
    router as company_holidays_router,
)
from app.api.v1.paysheet import router as paysheet_router
from app.api.v1.travelling_advance import router as travelling_advance_router
from app.api.v1.salary_details import router as salary_details_router
from app.api.v1.job_profile import router as job_profile_router
from app.api.v1.on_employment import router as on_employment_router
from app.api.v1.employment import router as employment_router
from app.api.v1.travelling_expenses_reimbursement import (
    router as travelling_expenses_reimbursement_router,
)

from app.api.v1.gl_tax_type import router as gl_tax_type_router
from app.api.v1.gl_group import router as gl_group_router
from app.api.v1.gl_account import router as gl_account_router
from app.api.v1.gl_bank_account import router as gl_bank_account_router
from app.api.v1.gl_cheque_range import router as gl_cheque_range_router
from app.api.v1.gl_hsn_master import router as gl_hsn_master_router
from app.api.v1.gl_sac_master import router as gl_sac_master_router

# NEW
from app.api.v1.gl_od_limit import router as gl_od_limit_router

from app.api.v1.router import router as api_v1_router

from app.core.database import Base, engine

from app.hr.recruitment.models import UserEnquiry
from app.models.attendance_coe import AttendanceCOE
from app.models.company_holiday import CompanyHoliday
from app.models.paysheet import Paysheet

# GL Models
from app.models.gl_tax_type import GLTaxType
from app.models.gl_group import GLGroup
from app.models.gl_account import GLAccount
from app.models.gl_bank_account import GLBankAccount
from app.models.gl_cheque_range import GLChequeRange
from app.models.gl_hsn_master import GLHSNMaster
from app.models.gl_sac_master import GLSACMaster

# NEW
from app.models.gl_od_limit import GLOdLimit


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Projecto API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users_router)
app.include_router(attendance_router)
app.include_router(attendance_coe_router)
app.include_router(company_holidays_router)
app.include_router(paysheet_router)
app.include_router(travelling_advance_router)
app.include_router(salary_details_router)
app.include_router(job_profile_router)
app.include_router(on_employment_router)
app.include_router(employment_router)
app.include_router(travelling_expenses_reimbursement_router)

# GL APIs
app.include_router(gl_tax_type_router)
app.include_router(gl_group_router)
app.include_router(gl_account_router)
app.include_router(gl_bank_account_router)
app.include_router(gl_cheque_range_router)
app.include_router(gl_hsn_master_router)
app.include_router(gl_sac_master_router)

# NEW
app.include_router(gl_od_limit_router)

app.include_router(api_v1_router)