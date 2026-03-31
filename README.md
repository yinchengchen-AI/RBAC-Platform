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
- 当前已完成前后端联调、容器联调和基础测试验证

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

- React
- TypeScript
- Vite
- Ant Design
- Zustand
- React Router
- Axios

### Backend

- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- Redis
- Passlib
- OpenPyXL

### Infrastructure

- PostgreSQL 16
- Redis 7
- MinIO
- Docker Compose
- Nginx

## 架构说明

项目采用前后端分离结构：

```text
frontend/   React 管理台
backend/    FastAPI 服务
deploy/     Docker 编排与部署配置
docs/       项目文档
```

后端采用模块化路由拆分，数据库结构通过 Alembic 迁移管理，种子数据独立初始化；前端基于当前用户菜单动态生成路由，并通过权限码控制页面内操作显隐。

## 当前状态

- 前后端、PostgreSQL、Redis、MinIO 已可通过 Docker Compose 完整启动
- 默认管理员可正常登录：`admin / Admin@123456`
- 前端菜单、动态路由和关键页面接口已完成联调
- Docker 容器全链路联调已通过
- 字典项和系统参数已支持 Excel 导入导出
- 角色数据权限已接入实际查询过滤
- 后端测试通过，前端生产构建通过

## 快速开始

### 方式一：Docker Compose

```bash
docker compose -f deploy/docker/compose.yml up --build -d
```

默认访问地址：

- 前端：`http://localhost:3000`
- 后端 API 文档：`http://localhost:8000/docs`
- 后端健康检查：`http://localhost:8000/api/v1/health`
- MinIO API：`http://localhost:9000`
- MinIO Console：`http://localhost:9001`

停止容器：

```bash
docker compose -f deploy/docker/compose.yml down
```

### 方式二：本地开发

后端：

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

前端：

```bash
cd frontend
npm install
npm run dev
```

## 默认账号

- 用户名：`admin`
- 密码：`Admin@123456`

## 测试与验证

已完成的验证包括：

- 后端单元与集成测试
- 前端生产构建
- Docker Compose 构建与启动验证
- 默认管理员登录验证
- 前端菜单与页面路由联调

## 文档

- 启动说明：`docs/setup.md`

## 后续规划

- 将数据权限继续接入更多业务列表查询
- 增加更完整的前端 E2E 自动化测试
- 增强导入校验反馈与模板化能力
- 持续补充项目文档与部署说明

## License

当前仓库未单独声明 License，如需开源发布，建议补充明确的许可证文件。
