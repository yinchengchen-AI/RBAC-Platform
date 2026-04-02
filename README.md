# RBAC Platform

一个面向中后台系统的可扩展权限管理平台，聚焦用户、角色、权限、菜单、数据权限、文件管理与审计日志等基础能力，便于后续业务模块快速接入。

前端基于 `React + Ant Design`，后端基于 `FastAPI`，配套 `PostgreSQL 16`、`Redis 7`、`MinIO`，采用前后端分离和模块化组织方式。

## 项目亮点

- 自建 RBAC 权限模型，不依赖 Casbin
- 支持菜单权限与按钮权限控制
- 支持角色数据权限范围配置
- 支持部门、字典、系统参数等平台基础模块
- 支持登录日志、操作日志统一审计
- 支持 MinIO 文件上传与统一文件管理
- 支持 Docker Compose 一键启动完整环境
- **代码质量评分 93.3/100** - 完善的测试覆盖和代码规范

## 功能清单

### 认证与授权

- 用户登录
- JWT access token / refresh token
- refresh token 轮换与失效控制
- 退出登录
- 当前用户信息获取
- 路由级菜单访问控制
- 按钮级权限显隐控制

### 平台基础模块

- 用户管理
- 角色管理
- 权限管理
- 菜单管理
- 部门管理
- 数据字典管理
- 系统参数管理
- 文件管理
- 合同管理
- 登录日志
- 操作日志

### 数据权限

- 全部数据
- 仅本人部门
- 本人及下级部门
- 自定义部门

当前已接入实际查询过滤的模块：

- 用户列表
- 部门列表

### 导入导出

- 字典项 Excel 导入导出
- 系统参数 Excel 导入导出

## 技术栈

### Frontend

- React 19
- TypeScript 5.9
- Vite 8
- Ant Design 5.28
- Zustand 5
- React Router 7
- Axios

### Backend

- FastAPI 0.116
- SQLAlchemy 2.0
- Alembic 1.16
- Pydantic 2
- Redis 6.4
- Passlib / bcrypt
- OpenPyXL
- pytest

### Infrastructure

- PostgreSQL 16
- Redis 7
- MinIO
- Docker & Docker Compose
- Nginx

## 架构说明

项目采用前后端分离结构：

```text
frontend/   React 管理台
backend/    FastAPI 服务
deploy/     Docker 编排与部署配置
docs/       项目文档
```

后端采用模块化路由拆分，当前仓库保留了 Alembic 基础结构但尚未提交 `versions/` 迁移脚本；首次初始化数据库时需要先创建表，再执行种子数据脚本。前端基于当前用户信息做路由、菜单和按钮级权限控制，并在角色/权限变更后主动刷新当前登录用户。

## 最近更新

- 后端 users / roles / permissions 删除接口统一改为使用 `*:delete` 权限码，修复前后端删除权限不一致问题
- `backend/db/init_db.py` 补齐 `system:user:delete`、`system:role:delete`、`system:permission:delete` 三个系统删除权限，并支持对已有库回填到 `super_admin`
- 前端路由权限不再默认放行，`ProtectedRoute` 和左侧菜单现在都复用同一套路由权限映射
- `users`、`roles`、`permissions` 页面在修改当前登录用户相关的角色/权限后会触发 `refreshCurrentUser()`，菜单和路由权限立即生效，无需重新登录
- `documents` 页面补齐上传/删除按钮权限控制，`configs` 和 `dicts` 页面补齐导入/导出按钮权限控制，`contracts` 页面补齐附件相关按钮权限控制
- `services` 页面移除前端假新增/编辑/删除能力，收敛为与后端接口一致的只读列表页
- 新增后端权限回归测试，最近一次权限回归结果为 `63 passed, 2 warnings`
- 用户管理表单支持部门树选择，便于在多级组织结构下快速归属用户
- 用户创建与编辑失败时会优先展示后端返回的明确错误信息，例如重名用户名、密码错误等
- 用户更新接口补齐 `department_id` 字段，避免编辑用户时出现后端 500
- 用户名重复校验覆盖软删除账户，冲突时返回 400 提示而不是数据库异常
- 头像上传补齐空文件名兜底处理，避免 `UploadFile.filename` 为空时触发 500
- MinIO `public` bucket 初始化时自动设置公开读策略，上传后的头像和公开文件可直接访问
- 合同表单内支持选择多个附件，并在合同保存成功后自动上传
- 合同附件弹窗支持查看、下载和删除已上传附件

## 关键行为说明

### 用户管理

- `department_id` 已纳入用户创建和更新请求体
- 新建用户时如果用户名已存在，接口会返回可直接展示的业务错误信息
- 如果用户名命中已软删除账户，也会阻止复用并返回明确提示

### RBAC 权限落地

- 后端接口的查看 / 新建 / 编辑 / 删除权限码已与前端按钮控制对齐，删除操作统一使用 `*:delete`
- 前端路由访问不再只依赖登录态，而是基于 `frontend/src/access/index.ts` 中的路由权限映射进行校验
- 左侧菜单会根据当前用户权限过滤，无权限用户即使手输 URL 也会被重定向回 `/dashboard`
- 当前登录用户的角色或权限被修改后，前端会主动刷新当前用户信息，菜单、路由和按钮显隐即时收敛
- 已创建非超管联调账号 `limited_user_230838 / Admin@123456` 用于验证 `/users`、`/roles`、`/permissions`、`/documents` 可访问，而 `/companies`、`/contracts`、`/services`、`/configs` 会返回 403

### 文件与头像上传

- 公开文件统一上传到 MinIO `public` bucket
- `public` bucket 会自动创建并写入匿名 `s3:GetObject` 读取策略
- 文件名为空时后端会回退到默认名称，避免因为扩展名解析失败导致上传异常

### 合同附件

- 新建合同时可在弹窗内先选择多个附件，合同保存后自动逐个上传
- 编辑合同时可继续追加新附件
- 已有附件统一通过“附件”弹窗管理

## 快速开始

### 方式一：基础设施 + 本地开发（推荐）

使用 Docker 启动基础设施（PostgreSQL、Redis、MinIO），本地运行前后端：

```bash
# 启动基础设施
docker compose -f deploy/docker/compose.infra.yml up -d

# 或使用 Make
make infra
```

后端：
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -c "from db.base import Base; from db.session import engine; Base.metadata.create_all(bind=engine)"
python -m scripts.seed
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

说明：

- 当前仓库只有 `backend/alembic/env.py` 和模板文件，尚未提交 `versions/` 迁移脚本，因此首次建表需要先执行 `Base.metadata.create_all(...)`
- 应用启动时会尝试补齐种子数据，但不会自动创建缺失的数据表
- 本地验证时前端 dev server 如果 `5173` 被占用会自动顺延到下一个可用端口，本次联调实际运行在 `http://127.0.0.1:3002`

前端：
```bash
cd frontend
npm install
npm run dev
```

### 方式二：Docker Compose 完整启动

```bash
docker compose -f deploy/docker/compose.yml up --build -d
```

### 方式三：一键启动脚本

```bash
./start-dev.sh
```

## 访问地址

启动后访问以下地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:5173 | React 开发服务器，端口被占用时 Vite 会自动顺延 |
| 前端生产 | http://localhost:3000 | Nginx 服务 |
| 后端 API | http://localhost:8000 | FastAPI 服务 |
| API 文档 | http://localhost:8000/docs | Swagger UI |
| MinIO | http://localhost:9001 | 对象存储控制台 |

## 默认账号

- 用户名：`admin`
- 密码：`Admin@123456`

联调用受限账号：

- 用户名：`limited_user_230838`
- 密码：`Admin@123456`
- 已验证拥有：`system:user:view`、`system:role:view`、`system:permission:view`、`system:file:view`

## 项目脚本

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

### Docker 工具脚本

```bash
./deploy/docker/scripts/health-check.sh   # 健康检查
./deploy/docker/scripts/backup.sh         # 数据备份
./deploy/docker/scripts/restore.sh -l     # 查看备份列表
./deploy/docker/scripts/restore.sh <file> # 恢复数据
```

## 代码质量

### 质量评分

| 维度 | 评分 | 状态 |
|------|------|------|
| Backend (Python) | 95/100 | ✅ |
| Frontend (TypeScript) | 95/100 | ✅ |
| 安全合规 | 88/100 | ✅ |
| 配置与部署 | 95/100 | ✅ |
| **综合评分** | **93.3/100** | ✅ |

### 检查工具

```bash
# Backend
cd backend
ruff check .           # 代码规范
pytest                 # 运行测试

# Frontend
cd frontend
npm run lint           # ESLint 检查
npm run build          # 生产构建
```

## 测试

```bash
# 后端测试
cd backend
pytest -v

# 最近一次权限回归结果
# 63 passed, 2 warnings
```

当前重点覆盖的测试文件：

- `tests/test_auth_flow.py`
- `tests/test_auth_guards.py`
- `tests/test_user_guards.py`
- `tests/test_data_scope_filters.py`
- `tests/test_permission_matrix.py`
- `tests/test_superuser_access.py`
- `tests/test_seed_permissions.py`

## Docker 支持

项目提供完整的 Docker 支持：

- **多阶段构建** - 优化镜像体积
- **非 Root 运行** - 提升安全性
- **健康检查** - 服务状态监控
- **资源限制** - CPU/内存限制
- **数据持久化** - 命名卷管理

详细文档：[deploy/docker/README.md](deploy/docker/README.md)

## 文档

- [部署文档](deploy/docker/README.md) - Docker 部署说明
- 启动说明：`docs/setup.md`
- 前端说明：`frontend/README.md`

## License

[MIT](LICENSE)
