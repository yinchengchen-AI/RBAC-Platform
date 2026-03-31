# 启动说明

## 方式一：本地开发

### 后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

如果本机已有 PostgreSQL 且账号密码不是示例值，请先调整 `DATABASE_URL`，否则 `alembic upgrade head` 会连接失败。

### 前端

```bash
cd frontend
npm install
npm run dev
```

## 方式二：Docker Compose

在项目根目录准备 `.env`，可参考 `.env.example`，然后执行：

```bash
docker compose -f deploy/docker/compose.yml up --build -d
```

容器启动时会自动执行：

- `alembic upgrade head`
- `python -m scripts.seed`
- MinIO `public` 和 `private` bucket 初始化

启动成功后默认访问地址：

- 前端：`http://localhost:3000`
- 后端 API 文档：`http://localhost:8000/docs`
- 后端健康检查：`http://localhost:8000/api/v1/health`
- MinIO API：`http://localhost:9000`
- MinIO Console：`http://localhost:9001`

如果镜像拉取失败，通常是 Docker 镜像源网络问题，不是项目配置错误。

当前如果出现以下镜像拉取失败：

- `python:3.12-slim`
- `node:24-alpine`
- `nginx:alpine`

优先处理 Docker 镜像源或代理配置，再执行 `docker compose up --build`。

### Docker 已验证的注意事项

- `BACKEND_CORS_ORIGINS` 在容器环境里需要使用 JSON 数组字符串，例如：

```env
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

- 后端容器启动命令使用 `python -m scripts.seed`，不要改回 `python scripts/seed.py`，否则容器内可能出现模块导入失败
- `passlib[bcrypt]==1.7.4` 需要配合 `bcrypt==4.0.1`，否则默认管理员种子初始化可能失败

## 默认账号

- 用户名：`admin`
- 密码：`Admin@123456`

## 当前已实现

- FastAPI 后端基础框架
- React + Ant Design 前端管理台框架
- JWT 登录与当前用户信息获取
- 用户、角色、权限、菜单、文件、日志 API
- 用户、角色、权限、菜单前端增删改界面
- 用户重置密码与文件删除
- 前端按钮级权限显隐
- 基于菜单的页面访问控制与树形侧边栏
- 前端基于菜单的动态路由生成
- 菜单管理树表展示
- MinIO 上传接口
- Alembic 迁移基础结构
- Redis refresh token 轮换与登出失效
- 独立种子数据脚本
- 失败请求操作日志中间件兜底
- 默认管理员和基础 RBAC 种子数据
- 登录与刷新 token 集成测试
- 非 GET 写请求统一操作日志记录
- 登录日志和操作日志支持分页与筛选
- 新增部门管理、字典管理、系统参数模块
- 用户可归属部门
- 字典项和系统参数支持缓存、Excel 导入导出
- 角色支持数据权限范围配置
- 数据权限已接入用户列表、部门列表查询

## 当前联调结果

- Docker Compose 全链路容器联调通过
- 默认管理员登录成功
- 前端首页、登录后菜单和主要页面路由可正常访问
- 关键页面依赖接口联调通过

## 当前运行约定

- 数据表创建由 `Alembic` 负责
- 应用启动不再执行 `create_all`
- 种子数据通过 `python -m scripts.seed` 初始化
