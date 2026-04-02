from datetime import date
from sqlalchemy import select
from db.session import SessionLocal
from models.contract import Contract, ContractStatus
from core.logging import logging

logger = logging.getLogger(__name__)


def check_expired_contracts():
    """检查并更新过期合同"""
    with SessionLocal() as db:
        try:
            # 查询已过期但状态未更新的合同
            stmt = select(Contract).where(
                Contract.end_date < date.today(),
                Contract.status.in_([
                    ContractStatus.SIGNED.value,
                    ContractStatus.EXECUTING.value,
                ]),
                Contract.is_deleted.is_(False),
            )
            contracts = db.scalars(stmt).all()

            count = 0
            for contract in contracts:
                contract.status = ContractStatus.EXPIRED.value
                count += 1

            db.commit()
            logger.info(f"合同过期检查完成，更新 {count} 个合同状态为已过期")
        except Exception as e:
            logger.error(f"合同过期检查失败: {e}")
            db.rollback()
