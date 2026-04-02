from datetime import date
from decimal import Decimal
from models.contract import Contract


def validate_contract_dates(sign_date: date | None, start_date: date | None, end_date: date | None) -> tuple[bool, str]:
    """验证合同日期逻辑"""
    if sign_date and start_date and sign_date > start_date:
        return False, "签订日期不能晚于开始日期"
    if start_date and end_date and start_date > end_date:
        return False, "开始日期不能晚于结束日期"
    return True, ""


def validate_contract_amounts(contract: Contract) -> tuple[bool, str]:
    """验证合同金额关系"""
    if contract.invoiced_amount > contract.amount:
        return False, f"已开票金额({contract.invoiced_amount})不能超过合同金额({contract.amount})"
    if contract.paid_amount > contract.invoiced_amount:
        return False, f"已收款金额({contract.paid_amount})不能超过已开票金额({contract.invoiced_amount})"
    return True, ""


def can_delete_contract(contract: Contract) -> tuple[bool, str]:
    """检查合同是否可以删除"""
    if contract.status in ['executing', 'completed']:
        return False, f"执行中或已完成的合同不能删除"
    if contract.invoiced_amount > 0:
        return False, "已开票的合同不能删除"
    return True, ""
