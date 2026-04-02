# 业务模块集成指南

## 已完成的工作

### 1. 后端模型迁移
已将安全生产系统的核心业务模型集成到 RBAC-Platform：
- 客户管理 (Company, CompanyContact)
- 合同管理 (Contract, ContractAttachment, ContractStatusHistory)
- 服务管理 (Service, ServiceRecord)
- 财务管理 (Invoice, Payment)
- 文档管理 (Document)

### 2. API 路由
已创建业务模块的 RESTful API：
- `/api/v1/companies` - 客户管理
- `/api/v1/contracts` - 合同管理
- `/api/v1/services` - 服务管理
- `/api/v1/finance` - 财务管理
- `/api/v1/documents` - 文档管理

### 3. 权限系统
已创建业务权限码，支持细粒度权限控制。

## 启动步骤

### 1. 运行数据库迁移
```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

### 2. 添加业务权限
```bash
python -m scripts.add_business_permissions
```

### 3. 启动后端服务
```bash
uvicorn main:app --reload
```

### 4. 访问 API 文档
打开浏览器访问: http://localhost:8000/docs

## 下一步工作

1. 前端页面迁移（从 safety-service-system 迁移 React 组件）
2. 完善业务逻辑（合同状态流转、财务统计等）
3. 测试验证

## 技术栈对比

| 项目 | 主键类型 | 时间戳 | 软删除 |
|------|---------|--------|--------|
| safety-service-system | BigInteger | created_at/updated_at | is_deleted |
| RBAC-Platform | UUID (String 36) | create_time/update_time | is_deleted |

所有业务模型已适配 RBAC-Platform 的架构规范。
