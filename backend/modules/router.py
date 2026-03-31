from fastapi import APIRouter

from modules.audit.router import router as audit_router
from modules.auth.router import router as auth_router
from modules.configs.router import router as configs_router
from modules.departments.router import router as departments_router
from modules.dicts.router import router as dicts_router
from modules.files.router import router as files_router
from modules.menus.router import router as menus_router
from modules.permissions.router import router as permissions_router
from modules.roles.router import router as roles_router
from modules.users.router import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(users_router, prefix="/users", tags=["用户"])
api_router.include_router(roles_router, prefix="/roles", tags=["角色"])
api_router.include_router(permissions_router, prefix="/permissions", tags=["权限"])
api_router.include_router(menus_router, prefix="/menus", tags=["菜单"])
api_router.include_router(files_router, prefix="/files", tags=["文件"])
api_router.include_router(audit_router, prefix="/logs", tags=["日志"])
api_router.include_router(departments_router, prefix="/departments", tags=["部门"])
api_router.include_router(dicts_router, prefix="/dicts", tags=["字典"])
api_router.include_router(configs_router, prefix="/configs", tags=["系统参数"])


@api_router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
