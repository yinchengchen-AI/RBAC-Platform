from sqlalchemy import select
from db.session import SessionLocal
from models.permission import Permission


def add_business_permissions():
    """添加业务模块权限"""
    with SessionLocal() as db:
        # 检查是否已存在
        existing = db.scalar(select(Permission).where(Permission.code == "business:company:view"))
        if existing:
            print("业务权限已存在，跳过")
            return

        permissions = [
            # 客户管理
            Permission(code="business:company:view", name="查看客户", module="companies"),
            Permission(code="business:company:create", name="创建客户", module="companies"),
            Permission(code="business:company:update", name="编辑客户", module="companies"),
            Permission(code="business:company:delete", name="删除客户", module="companies"),
            # 合同管理
            Permission(code="business:contract:view", name="查看合同", module="contracts"),
            Permission(code="business:contract:create", name="创建合同", module="contracts"),
            Permission(code="business:contract:update", name="编辑合同", module="contracts"),
            Permission(code="business:contract:delete", name="删除合同", module="contracts"),
            # 服务管理
            Permission(code="business:service:view", name="查看服务", module="services"),
            Permission(code="business:service:create", name="创建服务", module="services"),
            Permission(code="business:service:update", name="编辑服务", module="services"),
            # 财务管理
            Permission(code="business:invoice:view", name="查看发票", module="finance"),
            Permission(code="business:invoice:create", name="创建发票", module="finance"),
            Permission(code="business:payment:view", name="查看收款", module="finance"),
            Permission(code="business:payment:create", name="创建收款", module="finance"),
            # 文档管理
            Permission(code="business:document:view", name="查看文档", module="documents"),
            Permission(code="business:document:upload", name="上传文档", module="documents"),
        ]

        db.add_all(permissions)
        db.commit()
        print(f"成功添加 {len(permissions)} 个业务权限")


if __name__ == "__main__":
    add_business_permissions()
