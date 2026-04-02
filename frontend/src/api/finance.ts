import axios from 'axios'

const API_BASE = '/api/v1'

export interface InvoiceItem {
  id: string
  invoice_no: string
  amount: number
  status: string
  issue_date: string
  contract_id: string
  create_time: string
}

export interface PaymentItem {
  id: string
  code: string
  amount: number
  payment_date: string
  contract_id: string
  create_time: string
}

export const fetchInvoicesApi = (params?: { page?: number; page_size?: number }) =>
  axios.get(`${API_BASE}/finance/invoices`, { params })

export const createInvoiceApi = (data: any) =>
  axios.post(`${API_BASE}/finance/invoices`, data)

export const fetchPaymentsApi = (params?: { page?: number; page_size?: number }) =>
  axios.get(`${API_BASE}/finance/payments`, { params })

export const createPaymentApi = (data: any) =>
  axios.post(`${API_BASE}/finance/payments`, data)
