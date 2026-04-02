from decimal import Decimal
from sqlalchemy.orm import Session
from models.contract import Contract
from models.finance import Invoice, Payment


def update_contract_invoiced_amount(db: Session, contract_id: str, invoice_amount: Decimal):
    """更新合同已开票金额"""
    contract = db.get(Contract, contract_id)
    if contract:
        contract.invoiced_amount += invoice_amount
        db.commit()


def update_contract_paid_amount(db: Session, contract_id: str, payment_amount: Decimal):
    """更新合同已收款金额"""
    contract = db.get(Contract, contract_id)
    if contract:
        contract.paid_amount += payment_amount
        db.commit()


def validate_invoice_amount(contract: Contract, invoice_amount: Decimal) -> tuple[bool, str]:
    """验证开票金额是否合法"""
    total_invoiced = contract.invoiced_amount + invoice_amount
    if total_invoiced > contract.amount:
        return False, f"开票金额超出合同金额（合同: {contract.amount}, 已开票: {contract.invoiced_amount}, 本次: {invoice_amount}）"
    return True, ""


def validate_payment_amount(contract: Contract, payment_amount: Decimal) -> tuple[bool, str]:
    """验证收款金额是否合法"""
    total_paid = contract.paid_amount + payment_amount
    if total_paid > contract.invoiced_amount:
        return False, f"收款金额超出已开票金额（已开票: {contract.invoiced_amount}, 已收款: {contract.paid_amount}, 本次: {payment_amount}）"
    return True, ""
