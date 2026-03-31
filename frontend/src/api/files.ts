import request from '../utils/request'
import type { ApiResponse, FileItem } from '../types'

export const fetchFilesApi = () => request.get<ApiResponse<FileItem[]>>('/files')

export const deleteFileApi = (fileId: string) => request.delete<ApiResponse<null>>(`/files/${fileId}`)
