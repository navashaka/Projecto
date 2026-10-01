from fastapi import APIRouter

router = APIRouter(
    prefix="/gl",
    tags=["GL"],
)


@router.get("/")
def gl_root():
    return {
        "message": "GL module is working",
        "tables": [
            "gl_tax_types",
            "gl_groups",
            "gl_accounts",
            "gl_bank_accounts",
            "gl_cheque_ranges",
            "gl_hsn_master",
            "gl_sac_master",
            "gl_od_limits",
        ],
    }