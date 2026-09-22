from sqlalchemy.orm import Session

from app.models.gl_hsn_master import GLHSNMaster
from app.repositories.gl_hsn_master_repository import (
    create_gl_hsn_master,
    get_gl_hsn_masters,
    get_gl_hsn_master_by_id,
    update_gl_hsn_master,
    delete_gl_hsn_master,
)
from app.schemas.gl_hsn_master import GLHSNMasterCreate


def create_hsn_master(
    db: Session,
    data: GLHSNMasterCreate,
) -> GLHSNMaster:
    hsn_master = GLHSNMaster(
        chapter=data.chapter,
        heading=data.heading,
        sub_heading=data.sub_heading,
        hsn_code=data.hsn_code,
        description=data.description,
        cgst_rate=data.cgst_rate,
        sgst_utgst_rate=data.sgst_utgst_rate,
        igst_rate=data.igst_rate,
        compensation_cess=data.compensation_cess,
        effective_date=data.effective_date,
    )

    return create_gl_hsn_master(db, hsn_master)


def get_all_hsn_masters(
    db: Session,
) -> list[GLHSNMaster]:
    return get_gl_hsn_masters(db)


def get_hsn_master(
    db: Session,
    hsn_id: int,
) -> GLHSNMaster | None:
    return get_gl_hsn_master_by_id(db, hsn_id)


def update_hsn_master(
    db: Session,
    hsn_id: int,
    data: GLHSNMasterCreate,
) -> GLHSNMaster | None:
    hsn_master = get_gl_hsn_master_by_id(db, hsn_id)

    if hsn_master is None:
        return None

    hsn_master.chapter = data.chapter
    hsn_master.heading = data.heading
    hsn_master.sub_heading = data.sub_heading
    hsn_master.hsn_code = data.hsn_code
    hsn_master.description = data.description
    hsn_master.cgst_rate = data.cgst_rate
    hsn_master.sgst_utgst_rate = data.sgst_utgst_rate
    hsn_master.igst_rate = data.igst_rate
    hsn_master.compensation_cess = data.compensation_cess
    hsn_master.effective_date = data.effective_date

    return update_gl_hsn_master(db, hsn_master)


def delete_hsn_master(
    db: Session,
    hsn_id: int,
) -> bool:
    hsn_master = get_gl_hsn_master_by_id(db, hsn_id)

    if hsn_master is None:
        return False

    delete_gl_hsn_master(db, hsn_master)

    return True