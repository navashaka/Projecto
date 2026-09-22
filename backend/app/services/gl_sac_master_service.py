from sqlalchemy.orm import Session

from app.models.gl_sac_master import GLSACMaster
from app.repositories.gl_sac_master_repository import (
    create_gl_sac_master,
    get_gl_sac_masters,
    get_gl_sac_master_by_id,
    update_gl_sac_master,
    delete_gl_sac_master,
)
from app.schemas.gl_sac_master import GLSACMasterCreate


def create_sac_master(
    db: Session,
    data: GLSACMasterCreate,
) -> GLSACMaster:
    sac_master = GLSACMaster(
        chapter=data.chapter,
        heading=data.heading,
        sac_code=data.sac_code,
        description=data.description,
        cgst_rate=data.cgst_rate,
        sgst_utgst_rate=data.sgst_utgst_rate,
        igst_rate=data.igst_rate,
        compensation_cess=data.compensation_cess,
        effective_date=data.effective_date,
    )

    return create_gl_sac_master(db, sac_master)


def get_all_sac_masters(
    db: Session,
) -> list[GLSACMaster]:
    return get_gl_sac_masters(db)


def get_sac_master(
    db: Session,
    sac_id: int,
) -> GLSACMaster | None:
    return get_gl_sac_master_by_id(db, sac_id)


def update_sac_master(
    db: Session,
    sac_id: int,
    data: GLSACMasterCreate,
) -> GLSACMaster | None:
    sac_master = get_gl_sac_master_by_id(db, sac_id)

    if sac_master is None:
        return None

    sac_master.chapter = data.chapter
    sac_master.heading = data.heading
    sac_master.sac_code = data.sac_code
    sac_master.description = data.description
    sac_master.cgst_rate = data.cgst_rate
    sac_master.sgst_utgst_rate = data.sgst_utgst_rate
    sac_master.igst_rate = data.igst_rate
    sac_master.compensation_cess = data.compensation_cess
    sac_master.effective_date = data.effective_date

    return update_gl_sac_master(db, sac_master)


def delete_sac_master(
    db: Session,
    sac_id: int,
) -> bool:
    sac_master = get_gl_sac_master_by_id(db, sac_id)

    if sac_master is None:
        return False

    delete_gl_sac_master(db, sac_master)

    return True