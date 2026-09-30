'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { AlertCircle, ArrowRight, CheckCheck, History } from 'lucide-react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PriorityBadge, StatusBadge, UserAvatar } from '@/components/ui/hostlink'
import { useTaskWorkspace } from '@/components/task/task-workspace'
import { daysOverdue, statusLabels } from '@/lib/utils'
import type { Task, TaskEvent, User } from '@/lib/types'

export function OverdueTasks({ tasks, users }: { tasks: Task[]; users: User[] }) {
  const { openTask } = useTaskWorkspace()
  const overdue = tasks
  const reduced = useReducedMotion()
  return <Card size="sm" className="h-full min-w-0">
    <CardHeader><CardTitle>Needs attention</CardTitle><CardDescription>Overdue tasks, ordered by due date.</CardDescription><CardAction><Badge variant={overdue.length ? 'overdue' : 'secondary'}>{overdue.length} overdue</Badge></CardAction></CardHeader>
    <CardContent><ul className="flex max-h-80 flex-col gap-3 overflow-y-auto"><AnimatePresence initial={false} mode="popLayout">{overdue.map(task => {
      const user = users.find(user => user.id === task.assigneeId)
      return <motion.li key={task.id} layout={!reduced} initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -4 }} transition={{ duration: reduced ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}><button onClick={() => openTask(task.id)} className="flex w-full flex-col gap-2 rounded-md border border-l-[3px] border-l-danger bg-danger-soft/50 p-3 text-left outline-none transition-colors hover:bg-danger-soft focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Open ${task.key}: ${task.title}`}>
        <span className="flex flex-wrap items-center gap-2"><span className="text-[11px] text-muted-foreground">{task.key}</span><PriorityBadge priority={task.priority} /><span className="ml-auto flex items-center gap-1 text-[11px] text-danger"><AlertCircle className="size-3" />{daysOverdue(task)}d overdue</span></span>
        <span className="break-words text-[13px] font-medium text-strong">{task.title}</span>
        <span className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">{user && <><UserAvatar user={user} size="sm" /><span>{user.name}</span></>}<span className="ml-auto">Due {format(parseISO(task.dueDate), 'MMM d')}</span></span>
      </button></motion.li>
    })}{!overdue.length && <motion.li key="empty" initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }}><Empty className="min-h-44"><EmptyHeader><EmptyMedia variant="icon"><CheckCheck /></EmptyMedia><EmptyTitle>Nothing overdue</EmptyTitle><EmptyDescription>All open tasks are within their due dates.</EmptyDescription></EmptyHeader></Empty></motion.li>}</AnimatePresence></ul></CardContent>
  </Card>
}

export function ProjectActivity({ tasks, events, users }: { tasks: Task[]; events: TaskEvent[]; users: User[] }) {
  const { openTask } = useTaskWorkspace()
  const reduced = useReducedMotion()
  const recent = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  return <Card size="sm" className="h-full min-w-0">
    <CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>The latest updates from your team.</CardDescription></CardHeader>
    <CardContent>{recent.length ? <ol className="flex max-h-80 flex-col gap-4 overflow-y-auto">{recent.map(event => {
      const task = tasks.find(task => task.id === event.taskId)
      const user = users.find(user => user.id === event.userId)
      if (!task) return null
      return <motion.li key={event.id} layout={!reduced} initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }} className="flex items-start gap-3">{user && <UserAvatar user={user} size="sm" />}<div className="min-w-0 flex-1"><p className="text-xs"><span className="font-medium text-strong">{user?.name ?? 'Team member'}</span> {event.fromStatus ? 'moved' : 'created'} <button className="rounded text-left font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={() => openTask(task.id)}>{task.title}</button></p><div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">{event.fromStatus && <><span>{statusLabels[event.fromStatus]}</span><ArrowRight className="size-3" aria-hidden="true" /></>}<StatusBadge status={event.toStatus} /><time className="ml-auto" dateTime={event.createdAt} title={format(parseISO(event.createdAt), 'PPpp')}>{formatDistanceToNowStrict(parseISO(event.createdAt), { addSuffix: true })}</time></div></div></motion.li>
    })}</ol> : <Empty className="min-h-44"><EmptyHeader><EmptyMedia variant="icon"><History /></EmptyMedia><EmptyTitle>No activity yet</EmptyTitle><EmptyDescription>New tasks and status changes will appear here.</EmptyDescription></EmptyHeader></Empty>}</CardContent>
  </Card>
}
