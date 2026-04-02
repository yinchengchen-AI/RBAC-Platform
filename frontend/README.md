# Frontend

RBAC Platform 前端基于 `React 19 + TypeScript + Vite + Ant Design`，负责管理台页面、权限控制、业务表单和文件交互。

## 开发命令

```bash
npm install
npm run dev
npm run build
npm run lint
```

默认开发地址：`http://localhost:5173`。如果端口被占用，Vite 会自动顺延到下一个可用端口。

## 目录说明

```text
src/
  api/          接口封装
  pages/        页面组件
  layouts/      布局
  components/   通用组件
  access/       权限判断
  store/        Zustand 状态管理
  utils/        工具函数
```

## 当前前端特性

- 基于当前登录用户权限进行路由访问控制
- 左侧菜单按路由权限过滤显示
- 按钮级权限控制
- 用户、角色、权限、菜单、部门、字典、系统参数、文件、合同等页面
- 统一基于 Ant Design 表单、表格和弹窗组织后台交互

## 最近更新

### 用户管理

- 用户表单中的“所属部门”改为 `TreeSelect`，支持按部门层级选择
- 创建用户、编辑用户、重置密码失败时，会优先展示后端返回的 `detail` 错误信息
- 用户资料头像更新后，顶部布局会同步展示最新头像

### 合同管理

- 新增/编辑合同弹窗支持一次选择多个附件
- 附件会在合同保存成功后自动上传，避免先传附件再补合同主数据
- 已上传附件可在附件弹窗中查看、下载和删除

### 页面体验

- Dashboard 卡片间距已统一，减少页面块级错位

### RBAC 联动

- `src/access/index.ts` 维护路由到权限码的映射，`src/router/index.tsx` 和 `src/layouts/dashboard-layout.tsx` 复用同一套权限判断
- `src/store/auth.ts` 新增 `refreshCurrentUser()`，当前登录用户的角色或权限被修改后，菜单、路由和按钮显隐会即时刷新
- `src/pages/documents.tsx` 已补齐上传/删除权限控制
- `src/pages/dicts.tsx`、`src/pages/configs.tsx` 已补齐导入/导出权限控制
- `src/pages/contracts.tsx` 已补齐附件选择、上传、删除权限控制
- `src/pages/services.tsx` 已收敛为只读页面，避免前端展示后端未提供的增删改能力

## 联调约定

- 接口基础地址通过 `VITE_API_BASE_URL` 注入
- 后端业务错误会尽量透传到页面 toast，便于直接定位问题
- 公开头像和公开附件依赖 MinIO `public` bucket 的匿名读取策略
- Dashboard 接口已经统一走 `src/utils/request.ts`，避免因绕过拦截器导致 401
- 当前可使用 `limited_user_230838 / Admin@123456` 做非超管权限联调

## 相关页面

- `src/pages/users.tsx`：用户管理
- `src/pages/contracts.tsx`：合同管理
- `src/layouts/dashboard-layout.tsx`：管理台布局、菜单过滤与头像展示
- `src/router/index.tsx`：路由守卫
- `src/store/auth.ts`：登录态与当前用户刷新
