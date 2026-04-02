import { create } from 'zustand'
import type { Todo, TodoCount, TodoCreatePayload, TodoUpdatePayload } from '../types/todo'
import {
  createTodoApi,
  deleteTodoApi,
  fetchPendingTodosApi,
  fetchTodoCountApi,
  fetchTodosApi,
  toggleTodoStatusApi,
  updateTodoApi,
} from '../api/todos'

interface TodoState {
  todos: Todo[]
  pendingTodos: Todo[]
  count: TodoCount | null
  loading: boolean
  total: number
  page: number
  pageSize: number
  fetchTodos: (params?: { page?: number; pageSize?: number; status?: number | null }) => Promise<void>
  fetchPendingTodos: (limit?: number) => Promise<void>
  fetchCount: () => Promise<void>
  createTodo: (data: TodoCreatePayload) => Promise<void>
  updateTodo: (id: string, data: TodoUpdatePayload) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  pendingTodos: [],
  count: null,
  loading: false,
  total: 0,
  page: 1,
  pageSize: 10,

  fetchTodos: async (params = {}) => {
    set({ loading: true })
    try {
      const response = await fetchTodosApi({
        page: params.page || 1,
        page_size: params.pageSize || 10,
        status: params.status,
      })
      set({
        todos: response.data.items || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        pageSize: response.data.page_size || 10,
      })
    } catch (error) {
      console.error('Failed to fetch todos:', error)
      set({ todos: [], total: 0 })
    } finally {
      set({ loading: false })
    }
  },

  fetchPendingTodos: async (limit = 5) => {
    try {
      const response = await fetchPendingTodosApi(limit)
      set({ pendingTodos: response.data || [] })
    } catch (error) {
      console.error('Failed to fetch pending todos:', error)
      set({ pendingTodos: [] })
    }
  },

  fetchCount: async () => {
    try {
      const response = await fetchTodoCountApi()
      set({ count: response.data })
    } catch (error) {
      console.error('Failed to fetch todo count:', error)
    }
  },

  createTodo: async (data: TodoCreatePayload) => {
    try {
      const response = await createTodoApi(data)
      set((state) => ({
        todos: [response.data, ...state.todos],
        pendingTodos: [...state.pendingTodos, response.data].slice(0, 5),
      }))
      // 更新统计
      get().fetchCount()
    } catch (error) {
      console.error('Failed to create todo:', error)
      throw error
    }
  },

  updateTodo: async (id: string, data: TodoUpdatePayload) => {
    try {
      const response = await updateTodoApi(id, data)
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? response.data : t)),
        pendingTodos: state.pendingTodos.map((t) =>
          t.id === id ? response.data : t
        ),
      }))
    } catch (error) {
      console.error('Failed to update todo:', error)
      throw error
    }
  },

  deleteTodo: async (id: string) => {
    try {
      await deleteTodoApi(id)
      set((state) => ({
        todos: state.todos.filter((t) => t.id !== id),
        pendingTodos: state.pendingTodos.filter((t) => t.id !== id),
      }))
      // 更新统计
      get().fetchCount()
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  },

  toggleTodo: async (id: string) => {
    try {
      const response = await toggleTodoStatusApi(id)
      const updatedStatus = response.data.status
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id
            ? { ...t, status: updatedStatus, completed_at: response.data.completed_at }
            : t
        ),
        pendingTodos: updatedStatus === 1
          ? state.pendingTodos.filter((t) => t.id !== id)
          : state.pendingTodos,
      }))
      // 更新统计
      get().fetchCount()
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  },
}))
