from models.contract import ContractStatus


def validate_contract_status_transition(old_status: str, new_status: str) -> tuple[bool, str]:
    """验证合同状态流转是否合法"""
    valid_transitions = {
        ContractStatus.DRAFT.value: [ContractStatus.PENDING.value, ContractStatus.TERMINATED.value],
        ContractStatus.PENDING.value: [ContractStatus.APPROVED.value, ContractStatus.DRAFT.value, ContractStatus.TERMINATED.value],
        ContractStatus.APPROVED.value: [ContractStatus.SIGNED.value, ContractStatus.DRAFT.value, ContractStatus.TERMINATED.value],
        ContractStatus.SIGNED.value: [ContractStatus.EXECUTING.value, ContractStatus.TERMINATED.value],
        ContractStatus.EXECUTING.value: [ContractStatus.COMPLETED.value, ContractStatus.TERMINATED.value],
        ContractStatus.COMPLETED.value: [],
        ContractStatus.TERMINATED.value: [],
        ContractStatus.EXPIRED.value: [],
    }

    allowed = valid_transitions.get(old_status, [])
    if new_status in allowed:
        return True, ""
    return False, f"不能从 {old_status} 状态变更为 {new_status} 状态"
