from sqlalchemy.orm import Session

from app.models.gl_hsn_master import GLHSNMaster


def create_gl_hsn_master(
    db: Session,
    hsn_master: GLHSNMaster,
) -> GLHSNMaster:
    db.add(hsn_master)
    db.commit()
    db.refresh(hsn_master)
    return hsn_master


def get_gl_hsn_masters(
    db: Session,
) -> list[GLHSNMaster]:
    return db.query(GLHSNMaster).all()


def get_gl_hsn_master_by_id(
    db: Session,
    hsn_id: int,
) -> GLHSNMaster | None:
    return (
        db.query(GLHSNMaster)
        .filter(GLHSNMaster.id == hsn_id)
        .first()
    )


def update_gl_hsn_master(
    db: Session,
    hsn_master: GLHSNMaster,
) -> GLHSNMaster:
    db.commit()
    db.refresh(hsn_master)
    return hsn_master


def delete_gl_hsn_master(
    db: Session,
    hsn_master: GLHSNMaster,
) -> None:
    db.delete(hsn_master)
    db.commit()