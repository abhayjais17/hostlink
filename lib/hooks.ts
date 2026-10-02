'use client'

import useSWR from 'swr'
import { useStore } from 'zustand'
import * as api from './api'
import { domainStore, uiStore } from './store'
import type { TaskFilters } from './types'

function useApi<T>(key: readonly unknown[], fetcher: () => Promise<T>) {
  const revision = useStore(domainStore, state => state.revision)
  return useSWR(['hostlink', ...key, revision], fetcher, {
    keepPreviousData: true, revalidateOnFocus: true, shouldRetryOnError: false,
  })
}
export const useMyTasks = () => useApi(['my-tasks'], api.getMyTasks)
export const useWorkspaceAnalytics = () => useApi(['workspace-analytics'], api.getWorkspaceAnalytics)
export const useRecentActivity = () => useApi(['recent-activity'], api.getRecentActivity)
export const useWorkspaceSearch = (query: string) => useApi(['workspace-search', query], () => api.searchWorkspace(query))
export const useUsers = () => useApi(['users'], api.getUsers)
export const useCurrentUser = () => useApi(['current-user'], api.getCurrentUser)
export const useProjects = () => useApi(['projects'], api.getProjects)
export const useProjectSummaries = () => useApi(['project-summaries'], api.getProjectSummaries)
export const useProject = (id: string) => useApi(['project', id], () => api.getProject(id))
export const useTasks = (projectId?: string, filters: TaskFilters = {}) => useApi(['tasks', projectId, filters], () => api.getTasks(projectId, filters))
export const useBoardCommentCounts = (projectId: string) => useApi(['board-comments', projectId], () => api.getBoardCommentCounts(projectId))
export const useTask = (id: string) => useApi(['task', id], () => api.getTask(id))
export const useComments = (taskId: string) => useApi(['comments', taskId], () => api.getComments(taskId))
export const useTaskEvents = (taskId: string) => useApi(['task-events', taskId], () => api.getTaskEvents(taskId))
export const useProjectEvents = (projectId: string) => useApi(['project-events', projectId], () => api.getProjectEvents(projectId))
export const useAnalytics = (projectId: string) => useApi(['analytics', projectId], () => api.getAnalytics(projectId))
export const useTaskCommits = (taskId: string) => useApi(['task-commits', taskId], () => api.getTaskCommits(taskId))
const emptyFilters: TaskFilters = {}
export function useTaskFilters(projectId: string) {
  return useUIStore(state => state.filtersByProject[projectId] ?? emptyFilters)
}
export function useUIStore<T>(selector: (state: ReturnType<typeof uiStore.getState>) => T) { return useStore(uiStore, selector) }
