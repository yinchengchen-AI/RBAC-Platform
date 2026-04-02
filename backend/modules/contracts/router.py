from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from core.business_logic import validate_contract_status_transition
from core.contract_rules import can_delete_contract, validate_contract_dates
from core.deps import bind_current_user, permission_required
from core.responses import success
from core.storage import upload_public_file
from db.session import get_db
from models.contract import Contract, ContractAttachment, ContractStatusHistory
from models.company import Company
from models.user import User
from schemas.contract import ContractCreate, ContractStatusUpdate, ContractUpdate

router = APIRouter()


@router.get(
    "",
    summary="分页查询合同列表",
    description="按关键字和状态筛选合同，并返回分页结果。",
)
def list_contracts(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    keyword: str | None = None,
    status: str | None = None,
    _: User = Depends(permission_required("business:contract:view")),
    db: Session = Depends(get_db),
):
    stmt = select(Contract).where(Contract.is_deleted.is_(False))
    if keyword:
        stmt = stmt.where(
            or_(
                Contract.name.ilike(f"%{keyword}%"), Contract.code.ilike(f"%{keyword}%")
            )
        )
    if status:
        stmt = stmt.where(Contract.status == status)

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(
        stmt.order_by(Contract.create_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return success(
        data={"items": items, "total": total, "page": page, "page_size": page_size}
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="创建合同",
    description="创建合同主数据。创建前会校验客户是否存在，以及签订日期、开始日期、结束日期之间的业务逻辑。",
)
def create_contract(
    payload: ContractCreate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:contract:create")),
    db: Session = Depends(get_db),
):
    # 验证客户是否存在
    company = db.get(Company, payload.company_id)
    if not company or company.is_deleted:
        raise HTTPException(status_code=400, detail="客户不存在")

    # 验证日期逻辑
    is_valid, error_msg = validate_contract_dates(
        payload.sign_date, payload.start_date, payload.end_date
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    contract = Contract(**payload.model_dump(), created_by=current_user.id)
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return success(data=contract)


@router.get(
    "/{contract_id}",
    summary="获取合同详情",
    description="根据合同 ID 返回合同详情。若合同不存在或已删除则返回 404。",
)
def get_contract(
    contract_id: str,
    _: User = Depends(permission_required("business:contract:view")),
    db: Session = Depends(get_db),
):
    contract = db.get(Contract, contract_id)
    if not contract or contract.is_deleted:
        raise HTTPException(status_code=404, detail="合同不存在")
    return success(data=contract)


@router.put(
    "/{contract_id}",
    summary="更新合同",
    description="更新合同基础信息，不包含附件本体上传；附件请使用单独的附件上传接口。",
)
def update_contract(
    contract_id: str,
    payload: ContractUpdate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:contract:update")),
    db: Session = Depends(get_db),
):
    contract = db.get(Contract, contract_id)
    if not contract or contract.is_deleted:
        raise HTTPException(status_code=404, detail="合同不存在")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(contract, key, value)
    contract.updated_by = current_user.id
    db.commit()
    return success(data=contract)


@router.put(
    "/{contract_id}/status",
    summary="更新合同状态",
    description="执行合同状态流转校验，并写入状态变更历史。非法状态流转会返回 400。",
)
def update_contract_status(
    contract_id: str,
    payload: ContractStatusUpdate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:contract:update")),
    db: Session = Depends(get_db),
):
    contract = db.get(Contract, contract_id)
    if not contract or contract.is_deleted:
        raise HTTPException(status_code=404, detail="合同不存在")

    # 验证状态流转
    is_valid, error_msg = validate_contract_status_transition(
        contract.status, payload.status
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # 记录状态变更历史
    history = ContractStatusHistory(
        contract_id=contract.id,
        old_status=contract.status,
        new_status=payload.status,
        operator_id=current_user.id,
        operator_name=current_user.nickname,
        remark=payload.remark,
        created_by=current_user.id,
    )
    db.add(history)

    contract.status = payload.status
    contract.updated_by = current_user.id
    db.commit()
    return success(message="状态更新成功")


@router.delete(
    "/{contract_id}",
    summary="删除合同",
    description="软删除合同。删除前会校验当前合同状态是否允许删除。",
)
def delete_contract(
    contract_id: str,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:contract:delete")),
    db: Session = Depends(get_db),
):
    contract = db.get(Contract, contract_id)
    if not contract or contract.is_deleted:
        raise HTTPException(status_code=404, detail="合同不存在")

    # 验证是否可以删除
    can_delete, error_msg = can_delete_contract(contract)
    if not can_delete:
        raise HTTPException(status_code=400, detail=error_msg)

    contract.is_deleted = True
    contract.updated_by = current_user.id
    db.commit()
    return success(message="删除成功")


@router.post(
    "/{contract_id}/attachments",
    status_code=status.HTTP_201_CREATED,
    summary="上传合同附件",
    description="为指定合同上传单个附件。文件内容不能为空，空文件名会回退到默认附件名。",
)
async def upload_contract_attachment(
    contract_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:contract:update")),
    db: Session = Depends(get_db),
):
    contract = db.get(Contract, contract_id)
    if not contract or contract.is_deleted:
        raise HTTPException(status_code=404, detail="合同不存在")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="文件内容不能为空")

    filename = file.filename or "unknown_attachment"
    object_name, url = upload_public_file(
        filename, content, file.content_type or "application/octet-stream"
    )

    attachment = ContractAttachment(
        contract_id=contract_id,
        file_name=filename,
        file_path=url,
        file_size=len(content),
        file_type=file.content_type,
        created_by=current_user.id,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return success(
        data={
            "id": attachment.id,
            "file_name": attachment.file_name,
            "file_path": attachment.file_path,
        }
    )


@router.get(
    "/{contract_id}/attachments",
    summary="查询合同附件列表",
    description="返回指定合同下未删除的附件列表，供前端附件弹窗展示。",
)
def list_contract_attachments(
    contract_id: str,
    _: User = Depends(permission_required("business:contract:view")),
    db: Session = Depends(get_db),
):
    contract = db.get(Contract, contract_id)
    if not contract or contract.is_deleted:
        raise HTTPException(status_code=404, detail="合同不存在")

    attachments = db.scalars(
        select(ContractAttachment)
        .where(
            ContractAttachment.contract_id == contract_id,
            ContractAttachment.is_deleted.is_(False),
        )
        .order_by(ContractAttachment.create_time.desc())
    ).all()
    return success(data=attachments)


@router.delete(
    "/{contract_id}/attachments/{attachment_id}",
    summary="删除合同附件",
    description="软删除指定合同附件。若附件不属于当前合同或已删除则返回 404。",
)
def delete_contract_attachment(
    contract_id: str,
    attachment_id: str,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:contract:update")),
    db: Session = Depends(get_db),
):
    attachment = db.get(ContractAttachment, attachment_id)
    if not attachment or attachment.is_deleted or attachment.contract_id != contract_id:
        raise HTTPException(status_code=404, detail="附件不存在")

    attachment.is_deleted = True
    attachment.updated_by = current_user.id
    db.commit()
    return success(message="删除成功")
