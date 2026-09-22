from sqlalchemy.orm import Session

from app.models.gl_group import GLGroup


def create_gl_group(
    db: Session,
    gl_group: GLGroup,
) -> GLGroup:
    db.add(gl_group)
    db.commit()
    db.refresh(gl_group)
    return gl_group


def get_gl_groups(
    db: Session,
) -> list[GLGroup]:
    return db.query(GLGroup).all()


def get_gl_group_by_id(
    db: Session,
    group_id: int,
) -> GLGroup | None:
    return (
        db.query(GLGroup)
        .filter(GLGroup.id == group_id)
        .first()
    )


def update_gl_group(
    db: Session,
    gl_group: GLGroup,
) -> GLGroup:
    db.commit()
    db.refresh(gl_group)
    return gl_group


def delete_gl_group(
    db: Session,
    gl_group: GLGroup,
) -> None:
    db.delete(gl_group)
    db.commit()