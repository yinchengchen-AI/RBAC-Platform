import axios from 'axios'

const API_BASE = '/api/v1'

export interface ContractItem {
  id: string
  code: string
  name: string
  type: string
  amount: number
  invoiced_amount: number
  paid_amount: number
  company_id: string
  manager_id?: string
  status: string
  sign_date?: string
  start_date?: string
  end_date?: string
  service_content?: string
  service_cycle?: string
  service_times?: number
  payment_terms?: string
  remark?: string
  create_time: string
}

export interface ContractAttachment {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type?: string
  create_time: string
}

export const fetchContractsApi = (params?: { page?: number; page_size?: number; keyword?: string; status?: string }) =>
  axios.get(`${API_BASE}/contracts`, { params })

export const createContractApi = (data: Partial<ContractItem>) =>
  axios.post(`${API_BASE}/contracts`, data)

export const updateContractApi = (id: string, data: Partial<ContractItem>) =>
  axios.put(`${API_BASE}/contracts/${id}`, data)

export const updateContractStatusApi = (id: string, data: { status: string; remark?: string }) =>
  axios.put(`${API_BASE}/contracts/${id}/status`, data)

export const deleteContractApi = (id: string) =>
  axios.delete(`${API_BASE}/contracts/${id}`)

export const uploadContractAttachmentApi = (contractId: string, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return axios.post(`${API_BASE}/contracts/${contractId}/attachments`, formData)
}

export const fetchContractAttachmentsApi = (contractId: string) =>
  axios.get<{ data: ContractAttachment[] }>(`${API_BASE}/contracts/${contractId}/attachments`)

export const deleteContractAttachmentApi = (contractId: string, attachmentId: string) =>
  axios.delete(`${API_BASE}/contracts/${contractId}/attachments/${attachmentId}`)
