import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message, Cascader } from 'antd'
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, SearchOutlined, BankOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { Permission } from '../access/permission'
import { fetchCompaniesApi, createCompanyApi, updateCompanyApi, deleteCompanyApi, type CompanyItem } from '../api/companies'
import { fetchUsersApi } from '../api/users'
import type { UserItem } from '../types'
import { PageTitle } from '../components/page-title'
import { generateCompanyCode } from '../utils/code'

const statusOptions = [
  { label: '潜在客户', value: 'potential' },
  { label: '合作中', value: 'active' },
  { label: '暂停合作', value: 'inactive' },
  { label: '流失客户', value: 'lost' },
]

const statusColors: Record<string, string> = {
  potential: 'blue',
  active: 'success',
  inactive: 'warning',
  lost: 'default',
}

const scaleOptions = [
  { label: '小型企业', value: 'small' },
  { label: '中型企业', value: 'medium' },
  { label: '大型企业', value: 'large' },
  { label: '超大型企业', value: 'xlarge' },
]

const sourceOptions = [
  { label: '自主开发', value: 'self_developed' },
  { label: '客户推荐', value: 'referral' },
  { label: '展会', value: 'exhibition' },
  { label: '网络推广', value: 'online' },
  { label: '电话营销', value: 'telemarketing' },
  { label: '其他', value: 'other' },
]

// 浙江省杭州市四级联动数据（完整版）
const regionOptions = [
  {
    value: '浙江省',
    label: '浙江省',
    children: [
      {
        value: '杭州市',
        label: '杭州市',
        children: [
          {
            value: '上城区',
            label: '上城区',
            children: [
              { value: '湖滨街道', label: '湖滨街道' },
              { value: '清波街道', label: '清波街道' },
              { value: '望江街道', label: '望江街道' },
              { value: '南星街道', label: '南星街道' },
              { value: '紫阳街道', label: '紫阳街道' },
              { value: '小营街道', label: '小营街道' },
              { value: '凯旋街道', label: '凯旋街道' },
              { value: '采荷街道', label: '采荷街道' },
              { value: '闸弄口街道', label: '闸弄口街道' },
              { value: '四季青街道', label: '四季青街道' },
              { value: '笕桥街道', label: '笕桥街道' },
              { value: '彭埠街道', label: '彭埠街道' },
              { value: '九堡街道', label: '九堡街道' },
              { value: '丁兰街道', label: '丁兰街道' },
            ],
          },
          {
            value: '拱墅区',
            label: '拱墅区',
            children: [
              { value: '武林街道', label: '武林街道' },
              { value: '天水街道', label: '天水街道' },
              { value: '朝晖街道', label: '朝晖街道' },
              { value: '潮鸣街道', label: '潮鸣街道' },
              { value: '长庆街道', label: '长庆街道' },
              { value: '石桥街道', label: '石桥街道' },
              { value: '东新街道', label: '东新街道' },
              { value: '文晖街道', label: '文晖街道' },
              { value: '米市巷街道', label: '米市巷街道' },
              { value: '湖墅街道', label: '湖墅街道' },
              { value: '小河街道', label: '小河街道' },
              { value: '和睦街道', label: '和睦街道' },
              { value: '拱宸桥街道', label: '拱宸桥街道' },
              { value: '大关街道', label: '大关街道' },
              { value: '上塘街道', label: '上塘街道' },
              { value: '祥符街道', label: '祥符街道' },
              { value: '半山街道', label: '半山街道' },
              { value: '康桥街道', label: '康桥街道' },
            ],
          },
          {
            value: '西湖区',
            label: '西湖区',
            children: [
              { value: '北山街道', label: '北山街道' },
              { value: '西溪街道', label: '西溪街道' },
              { value: '灵隐街道', label: '灵隐街道' },
              { value: '翠苑街道', label: '翠苑街道' },
              { value: '文新街道', label: '文新街道' },
              { value: '古荡街道', label: '古荡街道' },
              { value: '转塘街道', label: '转塘街道' },
              { value: '留下街道', label: '留下街道' },
              { value: '蒋村街道', label: '蒋村街道' },
              { value: '三墩镇', label: '三墩镇' },
              { value: '双浦镇', label: '双浦镇' },
            ],
          },
          {
            value: '滨江区',
            label: '滨江区',
            children: [
              { value: '西兴街道', label: '西兴街道' },
              { value: '长河街道', label: '长河街道' },
              { value: '浦沿街道', label: '浦沿街道' },
            ],
          },
          {
            value: '萧山区',
            label: '萧山区',
            children: [
              { value: '城厢街道', label: '城厢街道' },
              { value: '北干街道', label: '北干街道' },
              { value: '蜀山街道', label: '蜀山街道' },
              { value: '新塘街道', label: '新塘街道' },
              { value: '靖江街道', label: '靖江街道' },
              { value: '南阳街道', label: '南阳街道' },
              { value: '闻堰街道', label: '闻堰街道' },
              { value: '宁围街道', label: '宁围街道' },
              { value: '新街街道', label: '新街街道' },
              { value: '盈丰街道', label: '盈丰街道' },
              { value: '楼塔镇', label: '楼塔镇' },
              { value: '河上镇', label: '河上镇' },
              { value: '戴村镇', label: '戴村镇' },
              { value: '浦阳镇', label: '浦阳镇' },
              { value: '进化镇', label: '进化镇' },
              { value: '临浦镇', label: '临浦镇' },
              { value: '义桥镇', label: '义桥镇' },
              { value: '所前镇', label: '所前镇' },
              { value: '衙前镇', label: '衙前镇' },
              { value: '瓜沥镇', label: '瓜沥镇' },
              { value: '益农镇', label: '益农镇' },
              { value: '党湾镇', label: '党湾镇' },
              { value: '萧山经济技术开发区', label: '萧山经济技术开发区' },
              { value: '萧山商业城', label: '萧山商业城' },
            ],
          },
          {
            value: '余杭区',
            label: '余杭区',
            children: [
              { value: '余杭街道', label: '余杭街道' },
              { value: '仓前街道', label: '仓前街道' },
              { value: '闲林街道', label: '闲林街道' },
              { value: '五常街道', label: '五常街道' },
              { value: '中泰街道', label: '中泰街道' },
              { value: '仁和街道', label: '仁和街道' },
              { value: '良渚街道', label: '良渚街道' },
              { value: '瓶窑镇', label: '瓶窑镇' },
              { value: '径山镇', label: '径山镇' },
              { value: '黄湖镇', label: '黄湖镇' },
              { value: '鸬鸟镇', label: '鸬鸟镇' },
              { value: '百丈镇', label: '百丈镇' },
            ],
          },
          {
            value: '临平区',
            label: '临平区',
            children: [
              { value: '临平街道', label: '临平街道' },
              { value: '南苑街道', label: '南苑街道' },
              { value: '东湖街道', label: '东湖街道' },
              { value: '星桥街道', label: '星桥街道' },
              { value: '运河街道', label: '运河街道' },
              { value: '乔司街道', label: '乔司街道' },
              { value: '崇贤街道', label: '崇贤街道' },
              { value: '塘栖镇', label: '塘栖镇' },
              { value: '临平经济开发区', label: '临平经济开发区' },
            ],
          },
          {
            value: '钱塘区',
            label: '钱塘区',
            children: [
              { value: '白杨街道', label: '白杨街道' },
              { value: '下沙街道', label: '下沙街道' },
              { value: '义蓬街道', label: '义蓬街道' },
              { value: '河庄街道', label: '河庄街道' },
              { value: '新湾街道', label: '新湾街道' },
              { value: '临江街道', label: '临江街道' },
              { value: '前进街道', label: '前进街道' },
              { value: '前进工业园区', label: '前进工业园区' },
            ],
          },
          {
            value: '富阳区',
            label: '富阳区',
            children: [
              { value: '富春街道', label: '富春街道' },
              { value: '东洲街道', label: '东洲街道' },
              { value: '春江街道', label: '春江街道' },
              { value: '鹿山街道', label: '鹿山街道' },
              { value: '银湖街道', label: '银湖街道' },
              { value: '场口镇', label: '场口镇' },
              { value: '常安镇', label: '常安镇' },
              { value: '万市镇', label: '万市镇' },
              { value: '洞桥镇', label: '洞桥镇' },
              { value: '胥口镇', label: '胥口镇' },
              { value: '新登镇', label: '新登镇' },
              { value: '渌渚镇', label: '渌渚镇' },
              { value: '灵桥镇', label: '灵桥镇' },
              { value: '大源镇', label: '大源镇' },
              { value: '常绿镇', label: '常绿镇' },
              { value: '龙门镇', label: '龙门镇' },
              { value: '里山镇', label: '里山镇' },
              { value: '上官乡', label: '上官乡' },
              { value: '永昌镇', label: '永昌镇' },
              { value: '环山乡', label: '环山乡' },
              { value: '湖源乡', label: '湖源乡' },
              { value: '春建乡', label: '春建乡' },
              { value: '新桐乡', label: '新桐乡' },
            ],
          },
          {
            value: '临安区',
            label: '临安区',
            children: [
              { value: '锦城街道', label: '锦城街道' },
              { value: '玲珑街道', label: '玲珑街道' },
              { value: '青山湖街道', label: '青山湖街道' },
              { value: '锦南街道', label: '锦南街道' },
              { value: '锦北街道', label: '锦北街道' },
              { value: '板桥镇', label: '板桥镇' },
              { value: '高虹镇', label: '高虹镇' },
              { value: '太湖源镇', label: '太湖源镇' },
              { value: '於潜镇', label: '於潜镇' },
              { value: '天目山镇', label: '天目山镇' },
              { value: '太阳镇', label: '太阳镇' },
              { value: '潜川镇', label: '潜川镇' },
              { value: '昌化镇', label: '昌化镇' },
              { value: '龙岗镇', label: '龙岗镇' },
              { value: '河桥镇', label: '河桥镇' },
              { value: '湍口镇', label: '湍口镇' },
              { value: '清凉峰镇', label: '清凉峰镇' },
              { value: '岛石镇', label: '岛石镇' },
            ],
          },
          {
            value: '建德市',
            label: '建德市',
            children: [
              { value: '新安江街道', label: '新安江街道' },
              { value: '洋溪街道', label: '洋溪街道' },
              { value: '更楼街道', label: '更楼街道' },
              { value: '莲花镇', label: '莲花镇' },
              { value: '乾潭镇', label: '乾潭镇' },
              { value: '梅城镇', label: '梅城镇' },
              { value: '杨村桥镇', label: '杨村桥镇' },
              { value: '下涯镇', label: '下涯镇' },
              { value: '大洋镇', label: '大洋镇' },
              { value: '三都镇', label: '三都镇' },
              { value: '寿昌镇', label: '寿昌镇' },
              { value: '航头镇', label: '航头镇' },
              { value: '大慈岩镇', label: '大慈岩镇' },
              { value: '大同镇', label: '大同镇' },
              { value: '李家镇', label: '李家镇' },
              { value: '钦堂乡', label: '钦堂乡' },
            ],
          },
          {
            value: '桐庐县',
            label: '桐庐县',
            children: [
              { value: '旧县街道', label: '旧县街道' },
              { value: '桐君街道', label: '桐君街道' },
              { value: '城南街道', label: '城南街道' },
              { value: '凤川街道', label: '凤川街道' },
              { value: '富春江镇', label: '富春江镇' },
              { value: '横村镇', label: '横村镇' },
              { value: '分水镇', label: '分水镇' },
              { value: '瑶琳镇', label: '瑶琳镇' },
              { value: '百江镇', label: '百江镇' },
              { value: '江南镇', label: '江南镇' },
              { value: '莪山畲族乡', label: '莪山畲族乡' },
              { value: '钟山乡', label: '钟山乡' },
              { value: '新合乡', label: '新合乡' },
              { value: '合村乡', label: '合村乡' },
            ],
          },
          {
            value: '淳安县',
            label: '淳安县',
            children: [
              { value: '千岛湖镇', label: '千岛湖镇' },
              { value: '文昌镇', label: '文昌镇' },
              { value: '石林镇', label: '石林镇' },
              { value: '临岐镇', label: '临岐镇' },
              { value: '威坪镇', label: '威坪镇' },
              { value: '姜家镇', label: '姜家镇' },
              { value: '梓桐镇', label: '梓桐镇' },
              { value: '汾口镇', label: '汾口镇' },
              { value: '中洲镇', label: '中洲镇' },
              { value: '大墅镇', label: '大墅镇' },
              { value: '枫树岭镇', label: '枫树岭镇' },
              { value: '里商乡', label: '里商乡' },
              { value: '金峰乡', label: '金峰乡' },
              { value: '富文乡', label: '富文乡' },
              { value: '左口乡', label: '左口乡' },
              { value: '屏门乡', label: '屏门乡' },
              { value: '瑶山乡', label: '瑶山乡' },
              { value: '王阜乡', label: '王阜乡' },
              { value: '宋村乡', label: '宋村乡' },
              { value: '鸠坑乡', label: '鸠坑乡' },
              { value: '浪川乡', label: '浪川乡' },
              { value: '界首乡', label: '界首乡' },
              { value: '安阳乡', label: '安阳乡' },
            ],
          },
        ],
      },
    ],
  },
]

interface CompanyFormValues {
  name: string
  code: string
  short_name?: string
  unified_code?: string
  industry?: string
  scale?: string
  region?: string[]
  province?: string
  city?: string
  district?: string
  street?: string
  address?: string
  status: string
  source?: string
  manager_id?: string
  remark?: string
}

export function CompaniesPage() {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [data, setData] = useState<CompanyItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CompanyItem | null>(null)
  const [form] = Form.useForm<CompanyFormValues>()

  const loadData = async (search = keyword) => {
    setLoading(true)
    try {
      const [companiesRes, usersRes] = await Promise.all([
        fetchCompaniesApi({ keyword: search }),
        fetchUsersApi({ page_size: 100 }),
      ])
      setData(companiesRes.data?.data?.items || [])
      setUsers(usersRes.data?.data?.items || [])
    } catch (error) {
      message.error('加载数据失败')
      console.error('loadData error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ 
      status: 'potential',
      code: generateCompanyCode(),
    })
    setOpen(true)
  }

  const handleEdit = (record: CompanyItem) => {
    setEditingItem(record)
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      short_name: record.short_name,
      unified_code: record.unified_code,
      industry: record.industry,
      scale: record.scale,
      province: record.province,
      city: record.city,
      district: record.district,
      street: record.street,
      address: record.address,
      status: record.status,
      source: record.source,
      manager_id: record.manager_id,
      remark: record.remark,
    })
    // 设置级联选择器的值
    if (record.province && record.city && record.district && record.street) {
      form.setFieldValue('region', [record.province, record.city, record.district, record.street])
    } else {
      form.setFieldValue('region', undefined)
    }
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteCompanyApi(id)
    message.success('删除成功')
    await loadData()
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    // 排除级联选择器的值，只提交实际字段
    const { region, ...submitValues } = values
    setSubmitting(true)
    try {
      if (editingItem) {
        await updateCompanyApi(editingItem.id, submitValues)
        message.success('更新成功')
      } else {
        await createCompanyApi(submitValues)
        message.success('创建成功')
      }
      setOpen(false)
      form.resetFields()
      await loadData()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-card">
      <PageTitle
        title="客户管理"
        description="管理客户信息，包括客户编码、行业、状态等。"
        extra={
          <Space>
            <Input
              allowClear
              placeholder="搜索客户名称或编码"
              prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
              onChange={(e) => {
                setKeyword(e.target.value)
                if (!e.target.value) {
                  void loadData('')
                }
              }}
              onPressEnter={(e) => {
                void loadData((e.target as HTMLInputElement).value)
              }}
              style={{ width: 260 }}
            />
            <Permission permission="business:company:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新增客户
              </Button>
            </Permission>
            <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
              刷新
            </Button>
          </Space>
        }
      />

      <Table<CompanyItem>
        rowKey="id"
        loading={loading}
        dataSource={data}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        columns={[
          {
            title: '客户',
            render: (_, record) => (
              <Space>
                <BankOutlined style={{ fontSize: 20, color: '#595959' }} />
                <div>
                  <div style={{ fontWeight: 500, color: '#1a1a1a' }}>{record.name}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.code}</div>
                </div>
              </Space>
            ),
          },
          {
            title: '简称',
            dataIndex: 'short_name',
            render: (value) => value || '-',
          },
          {
            title: '统一社会信用代码',
            dataIndex: 'unified_code',
            render: (value) => value || '-',
          },
          {
            title: '行业',
            dataIndex: 'industry',
            render: (value) => value || '-',
          },
          {
            title: '规模',
            dataIndex: 'scale',
            render: (value) => {
              const option = scaleOptions.find(o => o.value === value)
              return option?.label || value || '-'
            },
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (status: string) => (
              <Tag color={statusColors[status]}>
                {statusOptions.find(o => o.value === status)?.label}
              </Tag>
            ),
          },
          {
            title: '操作',
            width: 150,
            render: (_, record) => (
              <Space size="small">
                <Permission permission="business:company:update">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  >
                    编辑
                  </Button>
                </Permission>
                <Permission permission="business:company:delete">
                  <Popconfirm
                    title="确认删除该客户吗？"
                    description="此操作不可恢复"
                    onConfirm={() => void handleDelete(record.id)}
                  >
                    <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                </Permission>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editingItem ? '编辑客户' : '新增客户'}
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        destroyOnClose
        width={720}
      >
        <Form form={form} layout="vertical" style={{ marginTop: -8 }}>
          <Form.Item
            label="客户名称"
            name="name"
            rules={[{ required: true, message: '请输入客户名称' }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="请输入客户名称" size="middle" />
          </Form.Item>
          <Form.Item
            label="客户编码"
            name="code"
            rules={[{ required: true, message: '请输入客户编码' }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="系统自动生成" disabled size="middle" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item label="简称" name="short_name" style={{ width: 330, marginBottom: 12 }}>
              <Input placeholder="请输入简称" size="middle" />
            </Form.Item>
            <Form.Item label="统一社会信用代码" name="unified_code" style={{ width: 330, marginBottom: 12 }}>
              <Input placeholder="请输入统一社会信用代码" size="middle" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item label="所属行业" name="industry" style={{ width: 330, marginBottom: 12 }}>
              <Input placeholder="请输入所属行业" size="middle" />
            </Form.Item>
            <Form.Item label="企业规模" name="scale" style={{ width: 330, marginBottom: 12 }}>
              <Select allowClear placeholder="请选择企业规模" options={scaleOptions} size="middle" />
            </Form.Item>
          </Space>
          <Form.Item name="region" label="所在地区" style={{ marginBottom: 12 }}>
            <Cascader
              options={regionOptions}
              placeholder="请选择省/市/区/街道"
              style={{ width: '100%' }}
              size="middle"
              onChange={(value) => {
                if (value && value.length === 4) {
                  const [province, city, district, street] = value as string[]
                  form.setFieldsValue({
                    province,
                    city,
                    district,
                    street,
                    address: `${province}${city}${district}${street}`,
                  })
                }
              }}
            />
          </Form.Item>
          <Form.Item name="province" hidden><Input /></Form.Item>
          <Form.Item name="city" hidden><Input /></Form.Item>
          <Form.Item name="district" hidden><Input /></Form.Item>
          <Form.Item name="street" hidden><Input /></Form.Item>
          <Form.Item label="详细地址" name="address" style={{ marginBottom: 12 }}>
            <Input.TextArea rows={2} placeholder="请输入详细地址" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
              initialValue="potential"
              style={{ width: 330, marginBottom: 12 }}
            >
              <Select options={statusOptions} size="middle" />
            </Form.Item>
            <Form.Item label="客户来源" name="source" style={{ width: 330, marginBottom: 12 }}>
              <Select allowClear placeholder="请选择客户来源" options={sourceOptions} size="middle" />
            </Form.Item>
          </Space>
          <Form.Item label="客户经理" name="manager_id" style={{ marginBottom: 12 }}>
            <Select
              allowClear
              placeholder="请选择客户经理"
              showSearch
              optionFilterProp="label"
              options={users.map(u => ({ label: `${u.nickname} (${u.username})`, value: u.id }))}
              size="middle"
            />
          </Form.Item>
          <Form.Item label="备注" name="remark" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
