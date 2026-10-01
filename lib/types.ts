export const STATUSES = ['backlog', 'in_progress', 'review', 'done'] as const
export type Status = (typeof STATUSES)[number]
export const PRIORITIES = ['urgent', 'high', 'normal'] as const
export type Priority = (typeof PRIORITIES)[number]

export interface User { id: string; name: string; email: string; role: string; color: string }
export interface Project {
  id: string; name: string; description: string; color: string; createdAt: string; memberIds: string[]; updatedAt?: string
  members?: Array<{ userId: string; user: User }>
}
export interface ProjectSummary {
  project: Project; members: User[]; totalTasks: number; doneTasks: number
  overdueCount: number; completionPct: number; lastUpdated: string
}
export interface Task {
  id: string; key: string; projectId: string; title: string; description?: string
  assigneeId: string; priority: Priority; status: Status; dueDate: string
  createdAt: string; movedAt: string; completedAt?: string | null
}
export interface Comment { id: string; taskId: string; authorId: string; body: string; createdAt: string }
export interface TaskEvent {
  id: string; taskId: string; projectId: string; userId: string
  fromStatus: Status | null; toStatus: Status; createdAt: string
  user?: User; task?: Task; project?: Project
}
export interface TaskFilters {
  search?: string; assigneeIds?: string[]; priorities?: Priority[]; statuses?: Status[]
}
export interface BurndownPoint { date: string; total: number; done: number; remaining: number }
export interface WorkloadPoint {
  userId: string; name: string; color: string; backlog: number; in_progress: number; review: number; total: number
}
export interface Analytics {
  completionPct: number; total: number; counts: Record<Status, number>
  burndown: BurndownPoint[]; workload: WorkloadPoint[]; overdueCount: number; overdueTasks: Task[]
}
export interface DomainData {
  users: User[]; projects: Project[]; tasks: Task[]; comments: Comment[]; events: TaskEvent[]
}
export type CreateProjectInput = Pick<Project, 'name' | 'description' | 'color' | 'memberIds'>
export type UpdateProjectInput = Partial<CreateProjectInput>
export type CreateTaskInput = Pick<Task, 'projectId' | 'title' | 'assigneeId' | 'dueDate'> &
  Partial<Pick<Task, 'description' | 'priority' | 'status'>>
export type UpdateTaskInput = Partial<Pick<Task, 'title' | 'description' | 'assigneeId' | 'priority' | 'status' | 'dueDate'>>
