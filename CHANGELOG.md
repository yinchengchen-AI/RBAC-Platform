# Changelog

## 2026-04-02

### Backend

- 修复用户编辑接口缺少 `department_id` 字段导致的 500 错误
- 优化用户创建逻辑，对重复用户名和软删除重名账户返回明确的 400 业务错误
- 修复头像上传时 `UploadFile.filename` 为空可能引发的文件名解析异常
- 统一让前端可以直接消费后端返回的 `detail` 错误信息

### Frontend

- 用户管理表单的部门选择由普通下拉改为树形 `TreeSelect`
- 用户创建、编辑、删除、重置密码等操作失败时优先展示后端错误提示
- 修复顶部布局头像未及时跟随 `currentUser.avatar_url` 刷新的问题
- 调整 Dashboard 卡片间距，统一页面视觉节奏
- 合同表单支持多附件选择，并在合同保存后自动上传
- 合同附件弹窗支持查看、下载和删除

### Storage And Infra

- MinIO `public` bucket 在初始化时自动写入匿名 `s3:GetObject` 读取策略
- 公开头像和公开文件上传后可直接访问，修复 403 Forbidden 问题

### Docs

- 更新根目录 `README.md`，补充最近更新和关键行为说明
- 更新 `docs/setup.md`，补充 Docker 与本地开发注意事项
- 重写 `frontend/README.md`，替换默认模板内容为项目实际说明
- 新增本变更记录文件，便于后续持续追加版本变更
