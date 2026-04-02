import axios from 'axios'

const API_BASE = '/api/v1'

export interface CompanyItem {
  id: string
  name: string
  code: string
  short_name?: string
  unified_code?: string
  industry?: string
  scale?: string
  province?: string
  city?: string
  district?: string
  street?: string
  address?: string
  status: string
  source?: string
  manager_id?: string
  remark?: string
  create_time: string
}

export const fetchCompaniesApi = (params?: { page?: number; page_size?: number; keyword?: string; status?: string }) =>
  axios.get(`${API_BASE}/companies`, { params })

export const createCompanyApi = (data: Partial<CompanyItem>) =>
  axios.post(`${API_BASE}/companies`, data)

export const updateCompanyApi = (id: string, data: Partial<CompanyItem>) =>
  axios.put(`${API_BASE}/companies/${id}`, data)

export const deleteCompanyApi = (id: string) =>
  axios.delete(`${API_BASE}/companies/${id}`)
