import request from '../utils/request'
import type { ApiResponse, FileItem } from '../types'

// 文档管理 API（复用 files 模块，统一显示为文档管理）
export const fetchFilesApi = () => request.get<ApiResponse<FileItem[]>>('/documents')

export const deleteFileApi = (fileId: string) => request.delete<ApiResponse<null>>(`/documents/${fileId}`)
