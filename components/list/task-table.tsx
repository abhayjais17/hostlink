'use client'

import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Copy, Ellipsis, ExternalLink, ListTodo, MessageSquare, Pencil, SearchX } from 'lucide-react'
import { toast } from 'sonner'
import { TaskToolbar } from '@/components/task/task-toolbar'
import { useTaskWorkspace } from '@/components/task/task-workspace'
import { StatusDropdown } from './status-dropdown'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { IconButton, OverdueBadge, PriorityBadge, UserAvatar } from '@/components/ui/hostlink'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { clearTaskFilters, moveTask } from '@/lib/api'
import { useBoardCommentCounts, useTaskFilters, useTasks, useUsers } from '@/lib/hooks'
import { cn, isOverdue, sortTasks, statusLabels, taskPage, type TaskSort } from '@/lib/utils'
import type { Status, Task, User } from '@/lib/types'



export function TaskList({ projectId }: { projectId: string }) {
  const { openCreate } = useTaskWorkspace()
  const create = () => openCreate(projectId)
  const filters = useTaskFilters(projectId)
  const { data: tasks, error, mutate, isValidating } = useTasks(projectId, filters)
  const { data: users, error: usersError, mutate: reloadUsers } = useUsers()
  const { data: comments, error: commentsError, mutate: reloadComments } = useBoardCommentCounts(projectId)
  const hasFilters = !!(filters.search || filters.assigneeIds?.length || filters.priorities?.length || filters.statuses?.length)
  return <section aria-label="Project task list" className="flex min-w-0 flex-1 flex-col">
    <TaskToolbar projectId={projectId} view="list" onAdd={create} />
    {error || usersError || commentsError ? <div role="alert" className="flex flex-col items-start gap-3 p-7"><h2 className="font-semibold">Could not load tasks</h2><p>Your tasks have not been changed.</p><Button variant="secondary" onClick={() => { void mutate(); void reloadUsers(); void reloadComments() }}>Try again</Button></div>
      : !tasks || !users || !comments ? <div aria-label="Loading task list" aria-busy="true" className="flex flex-col gap-3 p-4 sm:p-7"><Skeleton className="h-10 w-full" />{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      : tasks.length === 0 ? <Empty className="m-4 min-h-72 border bg-surface sm:m-7"><EmptyHeader><EmptyMedia variant="icon">{hasFilters ? <SearchX /> : <ListTodo />}</EmptyMedia><EmptyTitle>{hasFilters ? 'No tasks match your filters' : 'No tasks yet'}</EmptyTitle><EmptyDescription>{hasFilters ? 'Try a different combination, or clear your filters to see all tasks.' : 'Give your project its first task, with a clear owner and due date.'}</EmptyDescription></EmptyHeader><EmptyContent>{hasFilters ? <Button variant="secondary" onClick={() => clearTaskFilters(projectId)}>Clear filters</Button> : <Button onClick={create}>Add task</Button>}</EmptyContent></Empty>
      : <TaskTable key={`${projectId}:${JSON.stringify(filters)}`} tasks={tasks} users={users} comments={comments} updating={isValidating} />}
  </section>
}

function TaskActions({ task }: { task: Task }) {
  const { openTask, openEdit } = useTaskWorkspace()
  async function copyKey() {
    try { await navigator.clipboard.writeText(task.key); toast.success(`${task.key} copied`) }
    catch { toast.error('Clipboard unavailable. Select and copy the task key instead.') }
  }
  return <div className="flex items-center justify-end gap-0.5" data-row-control>
    <span className="hidden opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 lg:inline-flex"><IconButton label={`Open ${task.key}`} onClick={() => openTask(task.id)}><ExternalLink /></IconButton></span>
    <DropdownMenu><DropdownMenuTrigger render={<IconButton label={`Actions for ${task.key}`}><Ellipsis /></IconButton>}><Ellipsis /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-44"><DropdownMenuGroup><DropdownMenuItem onClick={() => openTask(task.id)}><ExternalLink />Open task</DropdownMenuItem><DropdownMenuItem onClick={() => openEdit(task.id)}><Pencil />Edit task</DropdownMenuItem><DropdownMenuItem onClick={copyKey}><Copy />Copy task key</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
  </div>
}

function TaskTable({ tasks, users, comments, updating }: { tasks: Task[]; users: User[]; comments: Record<string, number>; updating: boolean }) {
  const { openTask } = useTaskWorkspace()
  const reduced = useReducedMotion()
  const [sort, setSort] = useState<TaskSort | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<string[]>([])
  const [pending, setPending] = useState<string | null>(null)
  const saving = useRef(false)
  const paged = taskPage(sortTasks(tasks, sort), page, pageSize)
  const selectedCount = selected.filter(id => tasks.some(task => task.id === id)).length
  const allSelected = paged.items.every(task => selected.includes(task.id))
  const someSelected = paged.items.some(task => selected.includes(task.id))
  const overdueCount = tasks.filter(task => isOverdue(task)).length
  function toggleSelected(id: string) { setSelected(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]) }
  function changeSort(field: TaskSort['field']) { setSort(previous => ({ field, direction: previous?.field === field && previous.direction === 'asc' ? 'desc' : 'asc' })); setPage(1) }
  async function changeStatus(task: Task, status: Status) {
    if (saving.current) return
    saving.current = true
    setPending(task.id)
    try { await moveTask(task.id, status); toast.success(`${task.key} moved to ${statusLabels[status]}`) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save this change.') }
    finally { saving.current = false; setPending(null) }
  }
  function sortHeader(field: TaskSort['field'], label: string) {
    return <TableHead aria-sort={sort?.field === field ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><Button variant="ghost" size="sm" onClick={() => changeSort(field)} aria-label={`Sort by ${label.toLowerCase()}`}>{label}{sort?.field === field ? <motion.span animate={{ rotate: sort.direction === 'desc' ? 180 : 0 }} transition={{ duration: reduced ? 0 : 0.15 }}><ArrowUp className="size-3.5" /></motion.span> : <ArrowUpDown />}</Button></TableHead>
  }
  return <motion.div initial={{ opacity: 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.15 }} className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-3"><h2 className="text-[13px] font-semibold">All tasks</h2><span className="text-xs tabular-nums text-muted-foreground" role="status">{tasks.length} tasks{overdueCount > 0 && <span className="ml-3 text-danger">{overdueCount} overdue</span>}</span></div>{selectedCount > 0 && <div className="flex items-center gap-2 text-xs"><span>{selectedCount} selected</span><Button variant="ghost" size="sm" onClick={() => setSelected([])}>Deselect all</Button></div>}</div>
    <div className="task-list-table hidden overflow-hidden rounded-lg border bg-surface shadow-sm md:block" aria-busy={updating}>
      <Table><caption className="sr-only">Project tasks. Sort by priority, status, or due date.</caption><TableHeader><TableRow>
        <TableHead className="w-10 pl-3"><Checkbox aria-label="Select all tasks on this page" checked={allSelected} indeterminate={someSelected && !allSelected} onCheckedChange={checked => setSelected(previous => checked ? [...new Set([...previous, ...paged.items.map(task => task.id)])] : previous.filter(id => !paged.items.some(task => task.id === id)))} /></TableHead>
        <TableHead>Key</TableHead><TableHead>Title</TableHead><TableHead>Assignee</TableHead>{sortHeader('priority', 'Priority')}{sortHeader('status', 'Status')}{sortHeader('dueDate', 'Due date')}<TableHead><span className="sr-only">Comments</span><MessageSquare aria-label="Comments" className="size-4" /></TableHead><TableHead><span className="sr-only">Actions</span></TableHead>
      </TableRow></TableHeader><TableBody>{paged.items.map(task => {
        const user = users.find(user => user.id === task.assigneeId)
        const overdue = isOverdue(task)
        return <TableRow key={task.id} data-task-key={task.key} data-overdue={overdue || undefined} data-state={selected.includes(task.id) ? 'selected' : undefined} className={cn('group cursor-pointer', overdue && 'bg-danger-soft')} onClick={event => { if (!(event.target as HTMLElement).closest('button, a, input, [role="checkbox"], [data-row-control]')) openTask(task.id) }}>
          <TableCell className={cn('border-l-[3px] pl-2', overdue ? 'border-l-danger' : 'border-l-transparent')}><Checkbox checked={selected.includes(task.id)} onCheckedChange={() => toggleSelected(task.id)} aria-label={`Select ${task.key}`} /></TableCell>
          <TableCell><span className="text-xs tabular-nums text-muted-foreground">{task.key}</span></TableCell>
          <TableCell className="min-w-48 whitespace-normal"><button onClick={() => openTask(task.id)} className="rounded text-left text-[13px] font-medium text-strong outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">{task.title}</button></TableCell>
          <TableCell>{user && <span className="flex items-center gap-2"><UserAvatar user={user} size="sm" /><span className="text-xs">{user.name}</span></span>}</TableCell>
          <TableCell><PriorityBadge priority={task.priority} /></TableCell><TableCell data-row-control><StatusDropdown task={task} pending={pending !== null} onMove={(task, status) => void changeStatus(task, status)} /></TableCell>
          <TableCell><div className="flex flex-col items-start gap-1"><time dateTime={task.dueDate} className={cn('text-xs tabular-nums', overdue && 'font-medium text-danger')}>{format(parseISO(task.dueDate), 'MMM d, yyyy')}</time>{overdue && <OverdueBadge />}</div></TableCell>
          <TableCell><span aria-label={`${comments[task.id] ?? 0} comments`} className="text-xs tabular-nums text-muted-foreground">{comments[task.id] ?? 0}</span></TableCell><TableCell><TaskActions task={task} /></TableCell>
        </TableRow>
      })}</TableBody></Table>
    </div>
    <div className="flex flex-col gap-3 md:hidden" aria-busy={updating}>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">Sort tasks<select aria-label="Sort tasks" className="h-8 min-w-0 flex-1 rounded-md border bg-surface px-2 text-body" value={sort ? `${sort.field}:${sort.direction}` : 'key'} onChange={event => { const [field, direction] = event.target.value.split(':'); setSort(field === 'key' ? null : { field, direction } as TaskSort); setPage(1) }}><option value="key">Task key</option>{(['dueDate', 'priority', 'status'] as const).flatMap(field => ['asc', 'desc'].map(direction => <option key={`${field}:${direction}`} value={`${field}:${direction}`}>{field === 'dueDate' ? 'Due date' : field === 'priority' ? 'Priority' : 'Status'} · {direction === 'asc' ? 'ascending' : 'descending'}</option>))}</select></label>
      {paged.items.map(task => {
        const user = users.find(user => user.id === task.assigneeId)
        const overdue = isOverdue(task)
        return <article key={task.id} data-task-key={task.key} className={cn('group flex flex-col gap-3 rounded-lg border border-l-[3px] bg-surface p-3 shadow-sm', overdue ? 'border-l-danger bg-danger-soft' : 'border-l-transparent')}>
          <div className="flex items-center gap-2"><Checkbox checked={selected.includes(task.id)} onCheckedChange={() => toggleSelected(task.id)} aria-label={`Select ${task.key}`} /><span className="flex-1 text-xs text-muted-foreground">{task.key}</span><PriorityBadge priority={task.priority} /><TaskActions task={task} /></div>
          <button onClick={() => openTask(task.id)} className="rounded text-left font-medium text-strong outline-none focus-visible:ring-2 focus-visible:ring-ring">{task.title}</button>
          <div className="flex flex-wrap items-center justify-between gap-2">{user && <span className="flex min-w-0 items-center gap-2 text-xs"><UserAvatar user={user} size="sm" />{user.name}</span>}<StatusDropdown task={task} pending={pending !== null} onMove={(task, status) => void changeStatus(task, status)} /></div>
          <div className="flex flex-wrap items-center gap-2 text-xs"><time dateTime={task.dueDate} className={cn(overdue && 'text-danger')}>{format(parseISO(task.dueDate), 'MMM d, yyyy')}</time>{overdue && <OverdueBadge />}<span className="ml-auto inline-flex items-center gap-1 text-muted-foreground"><MessageSquare className="size-3.5" />{comments[task.id] ?? 0}<span className="sr-only">comments</span></span></div>
        </article>
      })}
    </div>
    <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><p role="status" className="tabular-nums">Showing {paged.first}–{paged.last} of {tasks.length}</p><div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2">Rows per page<select aria-label="Rows per page" className="h-8 rounded-md border bg-surface px-2 text-body" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); setSelected([]) }}>{[5, 10, 25].map(size => <option key={size} value={size}>{size}</option>)}</select></label><nav aria-label="Task pagination" className="flex items-center gap-1"><IconButton label="Previous page" disabled={paged.page === 1} onClick={() => setPage(paged.page - 1)}><ChevronLeft /></IconButton><span className="min-w-12 text-center tabular-nums">{paged.page} / {paged.pageCount}</span><IconButton label="Next page" disabled={paged.page === paged.pageCount} onClick={() => setPage(paged.page + 1)}><ChevronRight /></IconButton></nav></div></footer>
  </motion.div>
}
