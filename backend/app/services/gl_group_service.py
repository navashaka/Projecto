from sqlalchemy.orm import Session

from app.models.gl_group import GLGroup
from app.repositories.gl_group_repository import (
    create_gl_group,
    get_gl_group_by_id,
    get_gl_groups,
    update_gl_group,
    delete_gl_group,
)
from app.schemas.gl_group import GLGroupCreate


def create_group(
    db: Session,
    data: GLGroupCreate,
) -> GLGroup:
    gl_group = GLGroup(
        name=data.name,
        parent_group_id=data.parent_group_id,
        is_default=data.is_default,
        tax_applicable=data.tax_applicable,
        costing_applicable=data.costing_applicable,
    )

    return create_gl_group(db, gl_group)


def get_all_groups(
    db: Session,
) -> list[GLGroup]:
    return get_gl_groups(db)


def get_group(
    db: Session,
    group_id: int,
) -> GLGroup | None:
    return get_gl_group_by_id(db, group_id)


def update_group(
    db: Session,
    group_id: int,
    data: GLGroupCreate,
) -> GLGroup | None:
    gl_group = get_gl_group_by_id(db, group_id)

    if gl_group is None:
        return None

    gl_group.name = data.name
    gl_group.parent_group_id = data.parent_group_id
    gl_group.is_default = data.is_default
    gl_group.tax_applicable = data.tax_applicable
    gl_group.costing_applicable = data.costing_applicable

    return update_gl_group(db, gl_group)


def delete_group(
    db: Session,
    group_id: int,
) -> bool:
    gl_group = get_gl_group_by_id(db, group_id)

    if gl_group is None:
        return False

    delete_gl_group(db, gl_group)
    return True