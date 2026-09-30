import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInCalendarDays, endOfDay, endOfWeek, format, isValid, parseISO, startOfDay, subDays } from 'date-fns'
import { STATUSES, type Analytics, type BurndownPoint, type Status, type Task, type TaskEvent, type User, type WorkloadPoint } from './types'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export const statusLabels: Record<Status, string> = {
  backlog: 'Backlog', in_progress: 'In Progress', review: 'Review', done: 'Done',
}
const transitions: Record<Status, readonly Status[]> = {
  backlog: ['in_progress'], in_progress: ['backlog', 'review'], review: ['in_progress', 'done'], done: ['review'],
}
export function allowedTransitions(status: Status): Status[] { return [...(transitions[status] ?? [])] }
export function transitionError(from: Status, to: Status): string {
  if (from === 'backlog') return 'Backlog tasks must move to In Progress first.'
  if (to === 'done') return 'Tasks must go through Review before Done.'
  if (from === 'done') return 'Completed tasks must reopen in Review first.'
  return `${statusLabels[from]} tasks can only move to ${allowedTransitions(from).map(s => statusLabels[s]).join(' or ')}.`
}
export function daysOverdue(task: Task, today = new Date()): number {
  if (task.status === 'done') return 0
  const date = parseISO(task.dueDate)
  return isValid(date) ? Math.max(0, differenceInCalendarDays(startOfDay(today), startOfDay(date))) : 0
}
export function isOverdue(task: Task, today = new Date()): boolean { return daysOverdue(task, today) > 0 }
export function initials(name: string): string { return name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase() }

export function groupPersonalTasks(tasks: Task[], today = new Date()) {
  const groups: Record<'Overdue' | 'Today' | 'This Week' | 'Later' | 'Completed', Task[]> = {
    Overdue: [], Today: [], 'This Week': [], Later: [], Completed: [],
  }
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  for (const task of sortTasks(tasks, { field: 'dueDate', direction: 'asc' })) {
    const due = parseISO(task.dueDate)
    const group = task.status === 'done' ? 'Completed' : isOverdue(task, today) ? 'Overdue'
      : differenceInCalendarDays(due, today) === 0 ? 'Today' : due <= weekEnd ? 'This Week' : 'Later'
    groups[group].push(task)
  }
  return groups
}

export type TaskSort = { field: 'dueDate' | 'priority' | 'status'; direction: 'asc' | 'desc' }
export function sortTasks(tasks: Task[], sort: TaskSort | null): Task[] {
  const priorityRank = { urgent: 0, high: 1, normal: 2 }
  return [...tasks].sort((a, b) => {
    const difference = !sort ? 0 : sort.field === 'dueDate' ? a.dueDate.localeCompare(b.dueDate)
      : sort.field === 'priority' ? priorityRank[a.priority] - priorityRank[b.priority]
      : STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status)
    return difference * (sort?.direction === 'desc' ? -1 : 1) || a.key.localeCompare(b.key, undefined, { numeric: true })
  })
}
export function taskPage(tasks: Task[], requestedPage: number, pageSize: number) {
  const size = Math.max(1, Math.floor(pageSize))
  const pageCount = Math.max(1, Math.ceil(tasks.length / size))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const start = (page - 1) * size
  return { items: tasks.slice(start, start + size), page, pageCount, first: tasks.length ? start + 1 : 0, last: Math.min(start + size, tasks.length) }
}

export function computeBurndown(events: TaskEvent[], tasks: Task[], today = new Date()): BurndownPoint[] {
  const taskIds = new Set(tasks.map(task => task.id))
  const ordered = events.filter(event => taskIds.has(event.taskId)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return Array.from({ length: 10 }, (_, index) => {
    const date = subDays(startOfDay(today), 9 - index)
    const cutoff = endOfDay(date).getTime()
    const existing = tasks.filter(task => parseISO(task.createdAt).getTime() <= cutoff)
    // Replay transitions, including reopen events; completedAt alone loses that history.
    const states = new Map<string, Status>()
    for (const event of ordered) {
      if (parseISO(event.createdAt).getTime() > cutoff) break
      states.set(event.taskId, event.toStatus)
    }
    const done = existing.filter(task => states.get(task.id) === 'done').length
    return { date: format(date, 'yyyy-MM-dd'), total: existing.length, done, remaining: existing.length - done }
  })
}
export function computeWorkload(tasks: Task[], users: User[]): WorkloadPoint[] {
  return users.map(user => {
    const open = tasks.filter(task => task.assigneeId === user.id && task.status !== 'done')
    return { userId: user.id, name: user.name, color: user.color,
      backlog: open.filter(task => task.status === 'backlog').length,
      in_progress: open.filter(task => task.status === 'in_progress').length,
      review: open.filter(task => task.status === 'review').length, total: open.length }
  })
}
export function computeAnalytics(tasks: Task[], events: TaskEvent[], users: User[], today = new Date()): Analytics {
  const counts = Object.fromEntries(STATUSES.map(status => [status, tasks.filter(task => task.status === status).length])) as Record<Status, number>
  const overdueTasks = tasks.filter(task => isOverdue(task, today)).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.key.localeCompare(b.key, undefined, { numeric: true }))
  return { total: tasks.length, completionPct: tasks.length ? Math.round(counts.done / tasks.length * 100) : 0,
    counts, burndown: computeBurndown(events, tasks, today), workload: computeWorkload(tasks, users),
    overdueCount: overdueTasks.length, overdueTasks }
}
