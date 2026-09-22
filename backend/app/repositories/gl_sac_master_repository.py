from sqlalchemy.orm import Session

from app.models.gl_sac_master import GLSACMaster


def create_gl_sac_master(
    db: Session,
    sac_master: GLSACMaster,
) -> GLSACMaster:
    db.add(sac_master)
    db.commit()
    db.refresh(sac_master)
    return sac_master


def get_gl_sac_masters(
    db: Session,
) -> list[GLSACMaster]:
    return db.query(GLSACMaster).all()


def get_gl_sac_master_by_id(
    db: Session,
    sac_id: int,
) -> GLSACMaster | None:
    return (
        db.query(GLSACMaster)
        .filter(GLSACMaster.id == sac_id)
        .first()
    )


def update_gl_sac_master(
    db: Session,
    sac_master: GLSACMaster,
) -> GLSACMaster:
    db.commit()
    db.refresh(sac_master)
    return sac_master


def delete_gl_sac_master(
    db: Session,
    sac_master: GLSACMaster,
) -> None:
    db.delete(sac_master)
    db.commit()