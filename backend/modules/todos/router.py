from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.deps import get_current_user
from core.responses import success
from db.session import get_db
from models.todo import Todo
from models.user import User
from schemas.todo import (
    TodoCountResponse,
    TodoCreate,
    TodoListResponse,
    TodoPageParams,
    TodoResponse,
    TodoToggleResponse,
    TodoUpdate,
)

router = APIRouter()


@router.get("", response_model=TodoListResponse)
def list_todos(
    params: TodoPageParams = Depends(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取待办列表"""
    stmt = select(Todo).where(Todo.user_id == current_user.id, Todo.is_deleted == False)
    count_stmt = select(func.count()).select_from(Todo).where(
        Todo.user_id == current_user.id, Todo.is_deleted == False
    )

    # 筛选条件
    if params.status is not None:
        stmt = stmt.where(Todo.status == params.status)
        count_stmt = count_stmt.where(Todo.status == params.status)
    if params.priority is not None:
        stmt = stmt.where(Todo.priority == params.priority)
        count_stmt = count_stmt.where(Todo.priority == params.priority)
    if params.category:
        stmt = stmt.where(Todo.category == params.category)
        count_stmt = count_stmt.where(Todo.category == params.category)

    # 排序：优先级降序 > 截止日期升序 > 创建时间降序
    stmt = stmt.order_by(
        Todo.priority.desc(),
        Todo.due_date.asc().nullslast(),
        Todo.create_time.desc(),
    )
    stmt = stmt.offset((params.page - 1) * params.page_size).limit(params.page_size)

    items = db.execute(stmt).scalars().all()
    total = db.execute(count_stmt).scalar()

    return TodoListResponse(
        items=[TodoResponse.model_validate(item) for item in items],
        total=total,
        page=params.page,
        page_size=params.page_size,
    )


@router.post("", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(
    data: TodoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """创建待办"""
    todo = Todo(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        due_date=data.due_date,
        category=data.category,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return TodoResponse.model_validate(todo)


@router.get("/count", response_model=TodoCountResponse)
def get_todo_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取待办统计"""
    # 总数量
    total_stmt = select(func.count()).select_from(Todo).where(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
    )
    total = db.execute(total_stmt).scalar()

    # 待办数量
    pending_stmt = select(func.count()).select_from(Todo).where(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.status == 0,
    )
    pending = db.execute(pending_stmt).scalar()

    # 已完成数量
    completed_stmt = select(func.count()).select_from(Todo).where(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.status == 1,
    )
    completed = db.execute(completed_stmt).scalar()

    # 高优先级待办
    high_priority_stmt = select(func.count()).select_from(Todo).where(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.status == 0,
        Todo.priority == 2,
    )
    high_priority = db.execute(high_priority_stmt).scalar()

    # 已逾期（截止日期已过且未完成）
    overdue_stmt = select(func.count()).select_from(Todo).where(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.status == 0,
        Todo.due_date < datetime.now(),
    )
    overdue = db.execute(overdue_stmt).scalar()

    return TodoCountResponse(
        total=total,
        pending=pending,
        completed=completed,
        high_priority=high_priority,
        overdue=overdue,
    )


@router.get("/pending", response_model=list[TodoResponse])
def get_pending_todos(
    limit: int = Query(default=5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取待办事项（优先级排序）"""
    stmt = (
        select(Todo)
        .where(Todo.user_id == current_user.id)
        .where(Todo.is_deleted == False)
        .where(Todo.status == 0)
        .order_by(Todo.priority.desc(), Todo.due_date.asc().nullslast())
        .limit(limit)
    )
    items = db.execute(stmt).scalars().all()
    return [TodoResponse.model_validate(item) for item in items]


@router.put("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: str,
    data: TodoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新待办"""
    todo = db.get(Todo, todo_id)
    if not todo or todo.user_id != current_user.id or todo.is_deleted:
        return success(message="待办不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(todo, key, value)

    db.commit()
    db.refresh(todo)
    return TodoResponse.model_validate(todo)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除待办"""
    todo = db.get(Todo, todo_id)
    if todo and todo.user_id == current_user.id:
        todo.is_deleted = True
        db.commit()
    return success(message="删除成功")


@router.post("/{todo_id}/toggle", response_model=TodoToggleResponse)
def toggle_todo_status(
    todo_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """切换待办完成状态"""
    todo = db.get(Todo, todo_id)
    if not todo or todo.user_id != current_user.id or todo.is_deleted:
        return success(message="待办不存在")

    todo.toggle_status()
    db.commit()
    db.refresh(todo)
    return TodoToggleResponse(
        id=todo.id,
        status=todo.status,
        completed_at=todo.completed_at,
    )
