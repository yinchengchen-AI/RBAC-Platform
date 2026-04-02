import axios from 'axios'

const API_BASE = '/api/v1'

export interface DashboardStats {
  overview: {
    company_total: number
    contract_total: number
    contract_amount: number
    contract_paid: number
    service_total: number
    invoice_amount: number
    payment_amount: number
  }
  company_by_status: { status: string; count: number }[]
  contract_by_status: { status: string; count: number }[]
  service_by_status: { status: string; count: number }[]
  recent_companies: {
    id: string
    name: string
    code: string
    status: string
    create_time: string
  }[]
  recent_contracts: {
    id: string
    name: string
    code: string
    amount: number
    status: string
    create_time: string
  }[]
}

export const fetchDashboardStatsApi = () =>
  axios.get(`${API_BASE}/dashboard/stats`)
