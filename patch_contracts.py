import re

with open("frontend/src/pages/contracts.tsx", "r") as f:
    content = f.read()

# Add UploadFile import
content = content.replace(
    "import type { UserItem } from '../types'",
    "import type { UserItem } from '../types'\nimport type { UploadFile } from 'antd/es/upload/interface'"
)

# Add fileList state
content = content.replace(
    "const [attachments, setAttachments] = useState<ContractAttachment[]>([])",
    "const [attachments, setAttachments] = useState<ContractAttachment[]>([])\n  const [fileList, setFileList] = useState<UploadFile[]>([])"
)

# Update handleCreate
content = content.replace(
    "setEditingItem(null)\n    form.resetFields()",
    "setEditingItem(null)\n    form.resetFields()\n    setFileList([])"
)

# Update handleEdit
content = content.replace(
    "setEditingItem(record)\n    form.setFieldsValue",
    "setEditingItem(record)\n    setFileList([])\n    form.setFieldsValue"
)

# Replace handleSubmit
old_submit = """  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        sign_date: values.sign_date?.format('YYYY-MM-DD'),
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      }
      if (editingItem) {
        await updateContractApi(editingItem.id, payload)
        message.success('更新成功')
      } else {
        await createContractApi(payload)
        message.success('创建成功')
      }
      setOpen(false)
      form.resetFields()
      await loadData()
    } finally {
      setSubmitting(false)
    }
  }"""

new_submit = """  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        sign_date: values.sign_date?.format('YYYY-MM-DD'),
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      }
      
      let contractId = editingItem?.id
      if (editingItem) {
        await updateContractApi(editingItem.id, payload)
      } else {
        const res = await createContractApi(payload)
        contractId = res.data.data.id
      }
      
      // Upload files
      if (contractId && fileList.length > 0) {
        for (const file of fileList) {
          const fileToUpload = file.originFileObj || file
          await uploadContractAttachmentApi(contractId, fileToUpload as File)
        }
      }
      
      message.success(editingItem ? '更新成功' : '创建成功')
      setOpen(false)
      form.resetFields()
      setFileList([])
      await loadData()
    } catch (error) {
      message.error(editingItem ? '更新失败' : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }"""

content = content.replace(old_submit, new_submit)

# Add Upload to Form
upload_field = """          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
          
          <Form.Item label="上传附件">
            <Upload
              multiple
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList((prev) => [...prev, file])
                return false
              }}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid))
              }}
            >
              <Button icon={<PaperClipOutlined />}>选择文件</Button>
            </Upload>
            <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
              {editingItem 
                ? '注：新增的附件将在保存后上传。要管理已有附件，请在表格操作栏点击【附件】。'
                : '注：选择的附件将在合同保存后自动上传。'}
            </div>
          </Form.Item>"""

content = content.replace(
    """          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>""",
    upload_field
)

with open("frontend/src/pages/contracts.tsx", "w") as f:
    f.write(content)

print("Patch applied")
