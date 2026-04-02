# 前端业务模块集成完成

## 已创建的页面

### 1. 客户管理 (/companies)
- 完整 CRUD 功能
- 状态管理（潜在客户、合作中、暂停合作、流失客户）
- 权限控制集成

### 2. 合同管理 (/contracts)
- 完整 CRUD 功能
- 合同状态流转
- 金额显示格式化

### 3. 服务管理 (/services)
- 列表查询功能
- 基础信息展示

### 4. 财务管理 (/finance)
- 发票管理（Tab 页面）
- 金额格式化显示

## 技术栈

- React 18 + TypeScript
- Ant Design 5
- React Router 7
- Axios

## 使用说明

### 启动前端
```bash
cd frontend
npm install
npm run dev
```

### 访问页面
需要先在后端添加对应的菜单配置，菜单路径：
- /companies - 客户管理
- /contracts - 合同管理
- /services - 服务管理
- /finance - 财务管理

## 注意事项

1. 所有页面已集成权限系统，使用 `<Permission>` 组件控制按钮显示
2. 页面风格保持与 RBAC-Platform 一致
3. API 调用已配置，需确保后端服务正常运行
