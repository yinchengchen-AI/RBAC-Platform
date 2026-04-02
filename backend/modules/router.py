from fastapi import APIRouter

from modules.audit.router import router as audit_router
from modules.auth.router import router as auth_router
from modules.companies.router import router as companies_router
from modules.dashboard.router import router as dashboard_router
from modules.configs.router import router as configs_router
from modules.contracts.router import router as contracts_router
from modules.departments.router import router as departments_router
from modules.dicts.router import router as dicts_router
from modules.documents.router import router as documents_router
from modules.files.router import router as files_router
from modules.finance.router import router as finance_router
from modules.notifications.router import router as notifications_router
from modules.permissions.router import router as permissions_router
from modules.roles.router import router as roles_router
from modules.services.router import router as services_router
from modules.todos.router import router as todos_router
from modules.users.router import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(users_router, prefix="/users", tags=["用户"])
api_router.include_router(roles_router, prefix="/roles", tags=["角色"])
api_router.include_router(permissions_router, prefix="/permissions", tags=["权限"])
api_router.include_router(files_router, prefix="/files", tags=["文件"])
api_router.include_router(files_router, prefix="/documents", tags=["文档管理"])
api_router.include_router(audit_router, prefix="/logs", tags=["日志"])
api_router.include_router(departments_router, prefix="/departments", tags=["部门"])
api_router.include_router(dicts_router, prefix="/dicts", tags=["字典"])
api_router.include_router(configs_router, prefix="/configs", tags=["系统参数"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["工作台"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["通知"])
api_router.include_router(todos_router, prefix="/todos", tags=["待办"])
api_router.include_router(companies_router, prefix="/companies", tags=["客户管理"])
api_router.include_router(contracts_router, prefix="/contracts", tags=["合同管理"])
api_router.include_router(services_router, prefix="/services", tags=["服务管理"])
api_router.include_router(finance_router, prefix="/finance", tags=["财务管理"])


@api_router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
