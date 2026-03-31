from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.data_scope import DataScopeRule
from models.department import Department
from models.user import User


def _build_department_children_map(
    departments: list[Department],
) -> dict[str, list[str]]:
    children_map: dict[str, list[str]] = defaultdict(list)
    for department in departments:
        if department.parent_id:
            children_map[department.parent_id].append(department.id)
    return dict(children_map)


def _collect_child_department_ids(
    department_id: str,
    children_map: dict[str, list[str]],
) -> set[str]:
    visible_ids = {department_id}
    stack = [department_id]
    while stack:
        current_id = stack.pop()
        for child_id in children_map.get(current_id, []):
            if child_id in visible_ids:
                continue
            visible_ids.add(child_id)
            stack.append(child_id)
    return visible_ids


def get_accessible_department_ids(db: Session, current_user: User) -> set[str] | None:
    if current_user.is_superuser:
        return None

    role_ids = [
        role.id
        for role in current_user.roles
        if role.status == 1 and not role.is_deleted
    ]
    if not role_ids:
        return {"__none__"}

    rules = db.scalars(
        select(DataScopeRule).where(
            DataScopeRule.role_id.in_(role_ids), DataScopeRule.is_deleted.is_(False)
        )
    ).all()
    if not rules or any(rule.scope_type == "all" for rule in rules):
        return None

    departments = db.scalars(
        select(Department).where(Department.is_deleted.is_(False))
    ).all()
    children_map = _build_department_children_map(departments)

    visible_ids: set[str] = set()
    for rule in rules:
        if rule.scope_type == "department_only":
            if current_user.department_id:
                visible_ids.add(current_user.department_id)
            continue
        if rule.scope_type == "department_and_children":
            if current_user.department_id:
                visible_ids.update(
                    _collect_child_department_ids(
                        current_user.department_id, children_map
                    )
                )
            continue
        if rule.scope_type == "custom_departments" and rule.department_ids:
            visible_ids.update(
                department_id.strip()
                for department_id in rule.department_ids.split(",")
                if department_id.strip()
            )

    return visible_ids or {"__none__"}
