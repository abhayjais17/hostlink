import { addDays, format, isValid, parseISO } from 'date-fns'
import { domainStore, uiStore } from './store'
import { allowedTransitions, computeAnalytics, groupPersonalTasks, isOverdue, transitionError } from './utils'
import { PRIORITIES, STATUSES, type Comment, type CreateProjectInput, type CreateTaskInput, type DomainData, type Project, type ProjectSummary, type Status, type Task, type TaskEvent, type TaskFilters, type UpdateProjectInput, type UpdateTaskInput } from './types'

export class ApiError extends Error {
  readonly error: string
  constructor(message: string, public readonly allowed: Status[] = [], public readonly code = 'VALIDATION') {
    super(message)
    this.name = 'ApiError'
    this.error = message
  }
}

const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000'

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new ApiError(error.error || response.statusText, error.allowed)
  }
  return response.json()
}

export function setSidebarExpanded(expanded: boolean) {
  uiStore.getState().setSidebarExpanded(expanded)
}

export function setTaskFilters(projectId: string, patch: Partial<TaskFilters>) {
  const current = uiStore.getState().filtersByProject[projectId] ?? {}
  uiStore.getState().setFilters(projectId, { ...current, ...patch })
}

export function clearTaskFilters(projectId: string) {
  uiStore.getState().clearFilters(projectId)
}

export function toggleProjectStar(id: string) {
  const ids = uiStore.getState().starredProjectIds
  uiStore.setState({ starredProjectIds: ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id] })
}

export async function getRecentActivity() {
  const events = await fetchJson<TaskEvent[]>('/api/workspace/recent-activity')
  return events
}

export async function searchWorkspace(query: string) {
  const term = query.trim().toLowerCase().slice(0, 200)
  const projects = await fetchJson<Project[]>(`/api/projects`)
  const tasks = await fetchJson<Task[]>(`/api/workspace/search?q=${encodeURIComponent(term)}`)

  return {
    projects: projects.filter(p => `${p.name} ${p.description}`.toLowerCase().includes(term)),
    tasks: tasks.slice(0, 8)
  }
}

export async function getUsers() {
  return fetchJson<any[]>('/api/users')
}

export async function getCurrentUser() {
  return fetchJson<any>('/api/users/me')
}

export async function setCurrentUser(id: string) {
  const user = await fetchJson<any>('/api/users', {
    method: 'PATCH',
    body: JSON.stringify({ currentUserId: id })
  })
  return user
}

export async function getProjects() {
  return fetchJson<Project[]>('/api/projects')
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  return fetchJson('/api/projects?summary=true')
}

export async function getProject(id: string) {
  return fetchJson(`/api/projects/${id}`)
}

export async function createProject(input: CreateProjectInput) {
  return fetchJson<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input)
  })
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  return fetchJson<Project>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  })
}

export async function deleteProject(id: string) {
  await fetchJson(`/api/projects/${id}`, { method: 'DELETE' })
}

export async function getTasks(projectId?: string, filters: TaskFilters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.append('q', filters.search)
  if (filters.assigneeIds) filters.assigneeIds.forEach(id => params.append('assignee', id))
  if (filters.priorities) filters.priorities.forEach(p => params.append('priority', p))
  if (filters.statuses) filters.statuses.forEach(s => params.append('status', s))

  const url = projectId
    ? `/api/projects/${projectId}/tasks?${params}`
    : `/api/workspace/tasks?${params}`

  return fetchJson<Task[]>(url)
}

export async function getBoardCommentCounts(projectId: string): Promise<Record<string, number>> {
  const tasks = await getTasks(projectId)
  const counts: Record<string, number> = {}

  for (const task of tasks) {
    const comments = await fetchJson<Comment[]>(`/api/tasks/${task.id}/comments`)
    counts[task.id] = comments.length
  }

  return counts
}

export async function quickAddTask(projectId: string, title: string) {
  const users = await getUsers()
  const projects = await getProjects()
  const project = projects.find(p => p.id === projectId)

  if (!project) throw new ApiError('Project not found')

  const currentUser = await getCurrentUser()
  const userId = project.memberIds?.includes(currentUser.id) ? currentUser.id : users[0]?.id

  return createTask({
    projectId,
    title,
    status: 'backlog',
    priority: 'normal',
    assigneeId: userId,
    dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd')
  }, userId)
}

export async function getTask(id: string) {
  return fetchJson<Task>(`/api/tasks/${id}`)
}

export async function createTask(input: CreateTaskInput, userId = '') {
  return fetchJson<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ ...input, userId })
  })
}

export async function updateTask(id: string, input: UpdateTaskInput, userId = '') {
  return fetchJson<Task>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...input, userId })
  })
}

export async function moveTask(id: string, toStatus: Status, userId = '') {
  return fetchJson<Task>(`/api/tasks/${id}/move`, {
    method: 'POST',
    body: JSON.stringify({ toStatus, userId })
  })
}

export async function deleteTask(id: string) {
  await fetchJson(`/api/tasks/${id}`, { method: 'DELETE' })
}

export async function getComments(taskId: string) {
  return fetchJson<Comment[]>(`/api/tasks/${taskId}/comments`)
}

export async function addComment(taskId: string, authorId: string, body: string) {
  return fetchJson<Comment>(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ authorId, body })
  })
}

export async function deleteComment(id: string) {
  await fetchJson(`/api/comments/${id}`, { method: 'DELETE' })
}

export async function getTaskEvents(taskId: string) {
  return fetchJson<TaskEvent[]>(`/api/tasks/${taskId}/events`)
}

export async function getProjectEvents(projectId: string) {
  return fetchJson<TaskEvent[]>(`/api/projects/${projectId}/events`)
}

export async function getMyTasks() {
  const user = await getCurrentUser()
  const tasks = await fetchJson<Task[]>(`/api/my-tasks?userId=${user.id}`)
  const projects = await getProjects()

  return {
    user,
    groups: groupPersonalTasks(tasks),
    projects,
    total: tasks.length,
    open: tasks.filter(t => t.status !== 'done').length
  }
}

export async function getWorkspaceAnalytics() {
  const projects = await getProjectSummaries()
  const users = await getUsers()

  const allTasks = await Promise.all(
    projects.map(p => getTasks(p.project.id))
  ).then(arr => arr.flat())

  const analytics = computeAnalytics(allTasks, [], users)

  return {
    analytics,
    users,
    projects
  }
}

export async function getAnalytics(projectId: string) {
  const project = await getProject(projectId)
  const tasks = await getTasks(projectId)
  const events = await getProjectEvents(projectId)
  const members = project.members?.map((m: any) => m.user) || []

  return computeAnalytics(tasks, events, members)
}
