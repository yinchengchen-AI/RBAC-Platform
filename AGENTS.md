# RBAC Platform - AI Agent Guide

本文档为 AI 编程助手提供项目背景、架构说明和开发规范，帮助快速理解和高效协作。

---

## 项目概述

RBAC Platform 是一个面向中后台系统的可扩展权限管理平台，聚焦用户、角色、权限、菜单、数据权限、文件管理与审计日志等基础能力。

### 核心特性

- 自建 RBAC 权限模型（不依赖 Casbin）
- 菜单权限与按钮权限控制
- 角色数据权限范围配置（全部/本人部门/本人及下级/自定义）
- 部门、字典、系统参数等平台基础模块
- 登录日志、操作日志统一审计
- MinIO 文件上传与统一管理
- Docker Compose 一键启动完整环境

---

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 5.9 | 类型安全 |
| Vite | 8 | 构建工具 |
| Ant Design | 5.28 | UI 组件库 |
| Zustand | 5 | 状态管理 |
| React Router | 7 | 路由管理 |
| Axios | - | HTTP 客户端 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| FastAPI | 0.116 | Web 框架 |
| SQLAlchemy | 2.0 | ORM |
| Alembic | 1.16 | 数据库迁移 |
| Pydantic | 2 | 数据验证 |
| Redis | 6.4 | 缓存/Token 存储 |
| Passlib/bcrypt | - | 密码加密 |
| python-jose | - | JWT 处理 |
| pytest | 8.4 | 测试框架 |

### 基础设施

| 服务 | 版本 | 用途 |
|------|------|------|
| PostgreSQL | 16 | 主数据库 |
| Redis | 7 | 缓存/会话 |
| MinIO | latest | 对象存储 |
| Nginx | - | 前端托管/反向代理 |

---

## 项目结构

```
RBAC-Platform/
├── frontend/           # React 前端应用
│   ├── src/
│   │   ├── api/       # API 接口定义
│   │   ├── components/# 通用组件
│   │   ├── layouts/   # 布局组件
│   │   ├── pages/     # 页面组件
│   │   ├── router/    # 路由配置
│   │   ├── store/     # Zustand 状态管理
│   │   ├── access/    # 权限控制逻辑
│   │   └── utils/     # 工具函数
│   ├── package.json   # npm 依赖
│   ├── vite.config.ts # Vite 配置
│   └── tsconfig.json  # TypeScript 配置
│
├── backend/           # FastAPI 后端服务
│   ├── modules/       # 业务模块路由
│   │   ├── auth/      # 认证模块
│   │   ├── users/     # 用户管理
│   │   ├── roles/     # 角色管理
│   │   ├── permissions/# 权限管理
│   │   ├── menus/     # 菜单管理
│   │   ├── departments/# 部门管理
│   │   ├── dicts/     # 数据字典
│   │   ├── configs/   # 系统参数
│   │   ├── files/     # 文件管理
│   │   └── audit/     # 审计日志
│   ├── models/        # SQLAlchemy 模型
│   ├── schemas/       # Pydantic 模式
│   ├── core/          # 核心功能
│   │   ├── config.py  # 配置管理
│   │   ├── security.py# 安全工具
│   │   ├── cache.py   # Redis 缓存
│   │   ├── storage.py # MinIO 存储
│   │   ├── middleware.py # 中间件
│   │   └── responses.py  # 统一响应
│   ├── db/            # 数据库相关
│   │   ├── session.py # 会话管理
│   │   └── init_db.py # 初始化逻辑
│   ├── scripts/       # 脚本工具
│   │   └── seed.py    # 种子数据
│   ├── tests/         # 测试用例
│   ├── alembic/       # 迁移脚本
│   ├── main.py        # 应用入口
│   └── requirements.txt # Python 依赖
│
├── deploy/            # 部署配置
│   └── docker/
│       ├── compose.yml      # 生产编排
│       ├── compose.infra.yml # 基础设施
│       ├── compose.dev.yml   # 开发环境
│       ├── nginx/
│       └── scripts/          # 工具脚本
│
├── Makefile           # 构建命令
└── start-dev.sh       # 一键启动脚本
```

---

## 开发环境配置

### 方式一：基础设施 + 本地开发（推荐）

```bash
# 1. 启动基础设施（PostgreSQL、Redis、MinIO）
make infra

# 2. 后端开发
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 3. 前端开发
cd frontend
npm install
npm run dev
```

### 方式二：一键启动脚本

```bash
./start-dev.sh
```

### 方式三：Docker Compose 完整启动

```bash
docker compose -f deploy/docker/compose.yml up --build -d
```

---

## 常用命令

### Make 命令

```bash
make help           # 显示所有命令
make infra          # 启动基础设施
make infra-down     # 停止基础设施
make build          # 构建 Docker 镜像
make up             # 启动完整服务
make down           # 停止完整服务
make logs           # 查看日志
make status         # 服务健康检查
```

### 后端开发

```bash
cd backend

# 依赖管理
pip install -r requirements.txt

# 数据库迁移
alembic revision --autogenerate -m "描述"
alembic upgrade head
alembic downgrade -1

# 种子数据
python -m scripts.seed

# 代码检查
ruff check .
ruff check . --fix

# 运行测试
pytest -v
```

### 前端开发

```bash
cd frontend

# 依赖管理
npm install

# 开发服务器
npm run dev          # http://localhost:5173

# 生产构建
npm run build

# 代码检查
npm run lint
```

---

## 代码规范

### Python 后端

- 使用 **Ruff** 进行代码检查和格式化
- 遵循 **PEP 8** 编码规范
- 类型注解：使用 Python 3.10+ 语法（`| None` 而非 `Optional`）
- 导入顺序：标准库 → 第三方库 → 本地模块
- 模型定义：使用 SQLAlchemy 2.0 的 `Mapped` 语法
- 时区处理：统一使用上海时区（UTC+8）

```python
# 示例：模型定义
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base, IdMixin, TimestampMixin

class User(Base, IdMixin, TimestampMixin):
    __tablename__ = "sys_user"
    
    username: Mapped[str] = mapped_column(String(50), unique=True)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
```

### TypeScript 前端

- 使用 **ESLint + typescript-eslint** 进行代码检查
- 严格类型检查开启
- 组件使用函数式组件 + Hooks
- 状态管理使用 Zustand
- API 调用统一封装在 `src/api/` 目录

```typescript
// 示例：API 定义
import { request } from '../utils/request'
import type { User } from '../types'

export const fetchUsersApi = () => 
  request.get<{ data: User[] }>('/users')
```

---

## 测试策略

### 后端测试

测试文件位于 `backend/tests/`，使用 pytest：

```bash
cd backend
pytest -v
```

测试覆盖：
- `test_auth_flow.py` - 认证流程（登录、刷新 Token）
- `test_auth_guards.py` - 权限守卫
- `test_user_guards.py` - 用户权限
- `test_crud_routes.py` - CRUD 路由
- `test_data_scope_filters.py` - 数据权限过滤
- `test_audit_routes.py` - 审计日志
- `test_security.py` - 安全功能
- `test_health.py` - 健康检查

测试使用 FakeRedis 和 FakeDB 进行依赖注入，避免依赖外部服务。

### 前端测试

目前项目未配置前端单元测试，建议使用 Vitest + React Testing Library 补充。

---

## 数据库迁移

使用 Alembic 管理数据库结构变更：

```bash
cd backend

# 生成迁移脚本
alembic revision --autogenerate -m "添加新表"

# 执行升级
alembic upgrade head

# 回滚一级
alembic downgrade -1

# 查看历史
alembic history
```

迁移脚本位于 `backend/alembic/versions/`。

---

## 配置管理

### 后端配置

配置通过环境变量 + `pydantic-settings` 管理，参见 `backend/core/config.py`：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接 | `postgresql+psycopg://postgres:postgres@localhost:5432/rbac_platform` |
| `REDIS_URL` | Redis 连接 | `redis://localhost:6379/0` |
| `MINIO_ENDPOINT` | MinIO 地址 | `localhost:9000` |
| `JWT_SECRET_KEY` | JWT 密钥 | `change-me-in-production` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access Token 过期 | 30 |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Refresh Token 过期 | 7 |
| `BACKEND_CORS_ORIGINS` | CORS 白名单 | `["http://localhost:3000"]` |

### 前端配置

运行时通过 `import.meta.env` 访问环境变量：

- `VITE_API_BASE_URL` - API 基础地址（构建时注入）

---

## API 规范

### 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": { }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "请求参数错误",
  "data": null
}
```

### 认证方式

- 登录获取 `access_token` 和 `refresh_token`
- 请求头携带 `Authorization: Bearer <access_token>`
- Access Token 30 分钟过期，使用 Refresh Token 续期
- Refresh Token 7 天过期，存储于 Redis 可吊销

---

## 权限系统

### 权限模型

- **菜单权限**：控制页面访问（路由级）
- **按钮权限**：控制操作显隐（权限码，如 `user:create`）
- **数据权限**：控制数据范围（全部/本人部门/本人及下级/自定义）

### 权限检查

前端权限检查：`src/access/permission.tsx`

```typescript
// 检查路由访问权限
hasRouteAccess(user, '/users')

// 检查按钮权限
hasPermission(user, 'user:create')
```

---

## 文件存储

使用 MinIO 作为对象存储：

- `public` bucket：公开访问（头像等）
- `private` bucket：私有访问（需预签名 URL）

上传流程：
1. 前端获取预签名上传 URL
2. 直接上传至 MinIO
3. 后端保存文件元数据

---

## 访问地址

开发环境启动后：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端开发 | http://localhost:5173 | Vite Dev Server |
| 后端 API | http://localhost:8000 | FastAPI |
| API 文档 | http://localhost:8000/docs | Swagger UI |
| MinIO 控制台 | http://localhost:9001 | 对象存储管理 |

默认账号：`admin / Admin@123456`

---

## 安全注意事项

1. **JWT 密钥**：生产环境必须修改 `JWT_SECRET_KEY`
2. **数据库密码**：避免使用默认密码
3. **CORS 配置**：生产环境限制为实际域名
4. **文件上传**：限制文件类型和大小（后端已做校验）
5. **Docker 部署**：使用非 root 用户运行容器

---

## 扩展开发指南

### 添加新模块

1. 在 `backend/modules/` 创建新目录
2. 定义模型（`models/`）
3. 定义 Schema（`schemas/`）
4. 实现路由（`modules/{name}/router.py`）
5. 注册路由（`modules/router.py`）
6. 生成迁移：`alembic revision --autogenerate`

### 添加前端页面

1. 在 `frontend/src/pages/` 创建页面组件
2. 在 `frontend/src/api/` 添加 API 接口
3. 在 `frontend/src/router/index.tsx` 注册路由
4. 在数据库菜单表中添加菜单项

---

## 故障排查

### 后端

```bash
# 检查数据库连接
alembic current

# 查看日志
uvicorn main:app --reload --log-level debug

# Redis 连接测试
redis-cli ping
```

### 前端

```bash
# 清除缓存
rm -rf node_modules/.vite
npm run dev

# 类型检查
npx tsc --noEmit
```

### Docker

```bash
# 查看服务状态
docker compose -f deploy/docker/compose.yml ps

# 查看日志
docker compose -f deploy/docker/compose.yml logs -f

# 重启服务
docker compose -f deploy/docker/compose.yml restart
```
