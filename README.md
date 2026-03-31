# RBAC Platform

一个可扩展的用户、角色、权限管理平台，前端使用 React + Ant Design，后端使用 FastAPI，基础设施使用 PostgreSQL 16、Redis 7、MinIO。

## 当前状态

- 前后端、PostgreSQL、Redis、MinIO 已可通过 Docker Compose 完整启动
- 默认管理员可正常登录：`admin / Admin@123456`
- 前端菜单、动态路由和关键页面接口已完成联调
- 字典项和系统参数已支持 Excel 导入导出
- 角色数据权限已接入用户列表、部门列表查询

## 目录结构

```text
frontend/   React 管理台
backend/    FastAPI 服务
deploy/     Docker 编排与部署相关文件
docs/       项目文档
scripts/    辅助脚本
```

## 一期目标

- 用户、角色、权限、菜单管理
- JWT 登录鉴权
- 按钮级权限控制
- 文件上传到 MinIO
- 登录日志、操作日志
- 便于后续植入其他业务模块

## 开发说明

后续可通过 `docker compose` 启动 PostgreSQL、Redis、MinIO 与前后端服务。

## Docker 快速启动

```bash
docker compose -f deploy/docker/compose.yml up --build -d
```

启动后默认访问地址：

- 前端：`http://localhost:3000`
- 后端 OpenAPI：`http://localhost:8000/docs`
- 后端健康检查：`http://localhost:8000/api/v1/health`
- MinIO API：`http://localhost:9000`
- MinIO Console：`http://localhost:9001`

默认管理员账号：

- 用户名：`admin`
- 密码：`Admin@123456`

如果需要停止容器：

```bash
docker compose -f deploy/docker/compose.yml down
```
