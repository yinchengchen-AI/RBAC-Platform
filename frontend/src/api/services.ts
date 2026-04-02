import axios from 'axios'

const API_BASE = '/api/v1'

export interface ServiceItem {
  id: string
  code: string
  name: string
  type: string
  status: string
  contract_id: string
  manager_id?: string
  planned_start_date?: string
  planned_end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  description?: string
  requirements?: string
  deliverables?: string
  remark?: string
  create_time: string
}

export const fetchServicesApi = (params?: { page?: number; page_size?: number; keyword?: string }) =>
  axios.get(`${API_BASE}/services`, { params })
