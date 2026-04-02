"""通知服务 - 处理业务事件触发的通知"""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models.notification import Notification, SHANGHAI_TZ
from models.contract import Contract
from models.service import Service
from models.finance import Invoice, Payment


class NotificationService:
    """通知服务类"""

    def __init__(self, db: Session):
        self.db = db

    def create_notification(
        self,
        user_id: str,
        title: str,
        content: str,
        type: str = "info",
        category: str = "system",
        source_id: str | None = None,
        source_type: str | None = None,
    ) -> Notification:
        """创建通知"""
        notification = Notification(
            user_id=user_id,
            title=title,
            content=content,
            type=type,
            category=category,
            source_id=source_id,
            source_type=source_type,
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def notify_contract_expiring(self, contract: Contract, user_id: str) -> None:
        """合同即将到期通知"""
        days_remaining = (contract.end_date - datetime.now(SHANGHAI_TZ)).days
        self.create_notification(
            user_id=user_id,
            title="合同即将到期",
            content=f'客户 "{contract.company.name}" 的合同将在{days_remaining}天后到期，请及时跟进续签事宜。',
            type="warning",
            category="contract",
            source_id=contract.id,
            source_type="contract",
        )

    def notify_service_pending_schedule(self, service: Service, user_id: str) -> None:
        """服务待排期通知"""
        self.create_notification(
            user_id=user_id,
            title="服务待排期",
            content=f'新签订的 "{service.name}" 需要安排服务人员进行现场服务。',
            type="info",
            category="service",
            source_id=service.id,
            source_type="service",
        )

    def notify_payment_received(self, payment: Payment, user_id: str) -> None:
        """收款确认通知"""
        self.create_notification(
            user_id=user_id,
            title="收款确认",
            content=f'客户 "{payment.contract.company.name}" 的合同款项 ¥{payment.amount:,.2f} 已到账，请确认。',
            type="success",
            category="finance",
            source_id=payment.id,
            source_type="payment",
        )

    def notify_invoice_pending(self, invoice: Invoice, user_id: str) -> None:
        """发票待开具通知"""
        self.create_notification(
            user_id=user_id,
            title="发票待开具",
            content=f'合同 "{invoice.contract.code}" 需要开具{invoice.invoice_type}发票。',
            type="info",
            category="finance",
            source_id=invoice.id,
            source_type="invoice",
        )

    def check_and_notify_expiring_contracts(self, days_before: int = 7) -> int:
        """检查并通知即将到期的合同，返回通知数量"""
        from sqlalchemy import select
        from models.company import Company

        target_date = datetime.now(SHANGHAI_TZ) + timedelta(days=days_before)
        
        stmt = (
            select(Contract, Company)
            .join(Company, Contract.company_id == Company.id)
            .where(Contract.end_date <= target_date)
            .where(Contract.end_date > datetime.now(SHANGHAI_TZ))
            .where(Contract.status == "executing")
        )
        
        results = self.db.execute(stmt).all()
        count = 0
        
        for contract, company in results:
            # 这里简化处理，实际应该根据合同负责人来通知
            # 暂时通知所有有权限的用户或特定角色
            contract.company = company
            # 获取合同相关人员（简化实现）
            from models.user import User
            from models.permission import Permission
            
            # 通知有合同查看权限的用户
            stmt_users = select(User).join(User.roles).join(Permission).where(
                Permission.code == "business:contract:view"
            )
            users = self.db.execute(stmt_users).scalars().all()
            
            for user in users:
                self.notify_contract_expiring(contract, user.id)
                count += 1
        
        return count

    def get_user_notifications(
        self,
        user_id: str,
        is_read: bool | None = None,
        limit: int = 10,
    ) -> list[Notification]:
        """获取用户通知"""
        from sqlalchemy import select

        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.create_time.desc())
            .limit(limit)
        )

        if is_read is not None:
            stmt = stmt.where(Notification.is_read == is_read)

        return list(self.db.execute(stmt).scalars().all())

    def get_unread_count(self, user_id: str) -> int:
        """获取未读通知数量"""
        from sqlalchemy import select, func

        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.is_read == False)
        )
        return self.db.execute(stmt).scalar() or 0
