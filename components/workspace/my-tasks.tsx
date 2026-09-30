'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, CheckCheck, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { OverdueBadge, PriorityBadge, StatusBadge, UserAvatar } from '@/components/ui/hostlink'
import { useTaskWorkspace } from '@/components/task/task-workspace'
import { useMyTasks } from '@/lib/hooks'
import { cn, isOverdue } from '@/lib/utils'
import type { Project, Task } from '@/lib/types'
import { PageError, PageFrame, PageLoading } from './page-frame'

function PersonalTaskRow({ task, projects }: { task: Task; projects: Project[] }) {
  const { openTask } = useTaskWorkspace()
  const overdue = isOverdue(task)
  return <li><button onClick={() => openTask(task.id)} data-task-key={task.key} className={cn('grid w-full gap-3 border-l-[3px] p-4 text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2 md:grid-cols-[minmax(0,1fr)_100px_128px_112px] md:items-center', overdue ? 'border-l-danger bg-danger-soft' : 'border-l-transparent')}>
    <span className="flex min-w-0 flex-col gap-1"><span className="break-words text-[13px] font-medium text-strong">{task.title}</span><span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground"><span>{task.key}</span><span aria-hidden="true">·</span><span>{projects.find(project => project.id === task.projectId)?.name ?? 'Project'}</span></span></span>
    <span className="flex flex-wrap items-center gap-2 md:contents"><PriorityBadge priority={task.priority} /><StatusBadge status={task.status} /><span className="ml-auto flex flex-col items-end gap-1 md:ml-0 md:items-start"><time dateTime={task.dueDate} className={cn('inline-flex items-center gap-1.5 text-xs tabular-nums', overdue ? 'text-danger' : 'text-muted-foreground')}><CalendarDays className="size-3.5" />{format(parseISO(task.dueDate), 'MMM d, yyyy')}</time>{overdue && <OverdueBadge />}</span></span>
  </button></li>
}

export function MyTasksPage() {
  const result = useMyTasks()
  const { openCreate } = useTaskWorkspace()
  const [search, setSearch] = useState('')
  if (result.error) return <PageError retry={() => void result.mutate()} />
  if (!result.data) return <PageLoading label="your tasks" />
  const { user, groups, projects, open, total } = result.data
  const term = search.trim().toLowerCase()
  const visible = Object.entries(groups).map(([name, tasks]) => ({ name, tasks: tasks.filter(task => `${task.key} ${task.title} ${projects.find(project => project.id === task.projectId)?.name ?? ''}`.toLowerCase().includes(term)) }))
  const visibleCount = visible.reduce((sum, group) => sum + group.tasks.length, 0)
  return <PageFrame>
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><UserAvatar user={user} size="lg" /><div className="min-w-0"><h2 className="text-base font-semibold">Your work, in focus</h2><p className="text-xs text-muted-foreground">{user.name} · {open} open {open === 1 ? 'task' : 'tasks'} across all projects</p></div></div><Button onClick={() => openCreate()}><Plus />Add task</Button></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex w-full max-w-sm items-center gap-2"><Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><Input aria-label="Search my tasks" placeholder="Search your tasks or projects…" value={search} onChange={event => setSearch(event.target.value)} /></div><span className="text-xs tabular-nums text-muted-foreground" role="status">{term ? `${visibleCount} of ${total}` : total} tasks assigned to you</span></div>
    {!visibleCount ? <Empty className="min-h-64 border bg-surface"><EmptyHeader><EmptyMedia variant="icon"><CheckCheck /></EmptyMedia><EmptyTitle>{term ? 'No matching tasks' : 'A little breathing room'}</EmptyTitle><EmptyDescription>{term ? 'Try another task title, key, or project name.' : 'You have no assigned tasks. New assignments will appear here.'}</EmptyDescription></EmptyHeader>{term && <Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button>}</Empty> : visible.filter(group => group.tasks.length > 0).map(({ name, tasks }) => name === 'Completed' ? <details key={`${user.id}:${name}`} className="overflow-hidden rounded-lg border bg-surface"><summary className="cursor-pointer px-4 py-3 text-sm font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring">Completed <span className="ml-2 tabular-nums">{tasks.length}</span></summary><ul className="divide-y border-t">{tasks.map(task => <PersonalTaskRow key={task.id} task={task} projects={projects} />)}</ul></details> : <section key={name} aria-label={`${name} tasks`} className="overflow-hidden rounded-lg border bg-surface shadow-sm"><header className="flex items-center gap-2 border-b px-4 py-3"><h2 className={cn('text-sm font-semibold', name === 'Overdue' && 'text-danger')}>{name}</h2><Badge variant="secondary">{tasks.length}</Badge>{name === 'This Week' && <span className="ml-auto text-xs text-muted-foreground">Through Sunday</span>}</header><ul className="divide-y">{tasks.map(task => <PersonalTaskRow key={task.id} task={task} projects={projects} />)}</ul></section>)}
    <p className="text-[11px] text-muted-foreground">Due dates use your local timezone. Completed work is kept separately so you can focus on what is next.</p>
  </PageFrame>
}
