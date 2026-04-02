import axios from 'axios'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // 如果是 FormData，让浏览器自动设置 Content-Type（包含 boundary）
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

request.interceptors.response.use(
  (response) => response,
  async (error) => {
    const detail = error?.response?.data?.detail || error.message || '请求失败'
    const url = error.config?.url || ''
    const isLoginRequest = url.includes('/auth/login')

    // 登录接口的错误由调用方处理，不自动显示消息也不重定向
    if (!isLoginRequest) {
      // 使用全局 message，需要在 App 组件内调用
      import('antd').then(({ message }) => {
        message.error(detail)
      })
      if (error?.response?.status === 401) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('current_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default request
