'use client'

import { useSortable } from '@dnd-kit/sortable'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, Check, Ellipsis, ExternalLink, GripVertical, MessageSquare, UserRound } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useTaskWorkspace } from '@/components/task/task-workspace'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { IconButton, OverdueBadge, PriorityBadge, StatusDot, UserAvatar } from '@/components/ui/hostlink'
import { allowedTransitions, cn, isOverdue, statusLabels, transitionError } from '@/lib/utils'
import { STATUSES, type Status, type Task, type User } from '@/lib/types'

export type CardFeedback = { id: string; kind: 'success' | 'rejected'; nonce: number } | null


export function TaskCardContent({ task, user, commentCount }: { task: Task; user?: User; commentCount: number }) {
  const overdue = isOverdue(task)
  return <>
    <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{task.key}</span><PriorityBadge priority={task.priority} /></div>
    <p className="line-clamp-2 min-h-10 text-[13px] leading-5 font-medium text-strong">{task.title}</p>
    <div className="flex flex-wrap items-center gap-2"><span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs', overdue ? 'bg-danger-soft text-danger' : 'bg-canvas text-muted-foreground')}><CalendarDays className="size-3" aria-hidden="true" /><time dateTime={task.dueDate}>{format(parseISO(task.dueDate), 'MMM d')}</time></span>{overdue && <OverdueBadge />}</div>
    <div className="mt-1 flex items-center justify-between gap-2"><div className="flex items-center gap-2">{user && <UserAvatar user={user} size="sm" />}<span className="max-w-28 truncate text-xs text-muted-foreground">{user?.name.split(' ')[0] ?? 'Unassigned'}</span></div><div className="flex items-center gap-3"><span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground" aria-label={`${commentCount} comments`}><MessageSquare className="size-3.5" aria-hidden="true" />{commentCount}</span><StatusDot status={task.status} /></div></div>
  </>
}

export function TaskCard({ task, user, commentCount, pending, feedback, onMove }: { task: Task; user?: User; commentCount: number; pending: boolean; feedback: CardFeedback; onMove: (task: Task, status: Status) => void }) {
  const { openTask } = useTaskWorkspace()
  const deferredDetails = () => openTask(task.id)
  const reduced = useReducedMotion()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { status: task.status }, disabled: pending })
  const result = feedback?.id === task.id ? feedback : null
  const allowed = allowedTransitions(task.status)
  return <div ref={setNodeRef} style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, transition: reduced ? undefined : transition }} className={cn('relative', isDragging && 'rounded-lg border border-dashed border-primary bg-brand-50')}>
    <motion.article key={result?.nonce ?? 'idle'} data-task-id={task.id} data-task-key={task.key} data-status={task.status} data-overdue={isOverdue(task)} aria-label={`${task.key}: ${task.title}`} initial={result?.kind === 'success' && !reduced ? { scale: 1.025 } : false} animate={{ scale: 1, x: result?.kind === 'rejected' && !reduced ? [0, -6, 6, -6, 6, 0] : 0 }} transition={result?.kind === 'rejected' ? { duration: reduced ? 0 : 0.24, delay: 0.18 } : { type: 'spring', stiffness: 420, damping: 24 }} className={cn('group relative rounded-lg border bg-surface p-3 shadow-sm transition-[box-shadow,background-color,border-color] duration-150 hover:shadow-md', isOverdue(task) && 'border-l-[3px] border-l-danger bg-danger-soft/50', isDragging && 'opacity-0')}>
      <button type="button" aria-label={`Open ${task.key}: ${task.title}`} className="absolute inset-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={deferredDetails} />
      <div className="pointer-events-none flex flex-col gap-3"><TaskCardContent task={task} user={user} commentCount={commentCount} /></div>
      <div className="relative mt-2 flex items-center justify-between border-t pt-1.5">
        <IconButton ref={setActivatorNodeRef} {...attributes} {...listeners} label={`Drag ${task.key}`} disabled={pending} className="touch-none cursor-grab active:cursor-grabbing"><GripVertical /></IconButton>
        <div className="flex items-center gap-0.5"><div className="flex opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"><IconButton label={`Open details for ${task.key}`} onClick={deferredDetails}><ExternalLink /></IconButton><IconButton label={`Assign ${task.key}`} onClick={deferredDetails}><UserRound /></IconButton></div>
          <DropdownMenu><DropdownMenuTrigger render={<IconButton label={`Move ${task.key} to another status`} disabled={pending}><Ellipsis /></IconButton>}><Ellipsis /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64"><DropdownMenuGroup><DropdownMenuLabel>Move to…</DropdownMenuLabel>{STATUSES.map(status => {
              const current = task.status === status
              const enabled = allowed.includes(status)
              return <DropdownMenuItem key={status} disabled={!enabled || pending} onClick={() => onMove(task, status)} className="items-start"><StatusDot status={status} /><span className="flex flex-1 flex-col gap-0.5"><span>{statusLabels[status]}{current && ' (current)'}</span>{!enabled && !current && <span className="text-[11px] leading-4">{transitionError(task.status, status)}</span>}</span>{current && <Check />}</DropdownMenuItem>
            })}</DropdownMenuGroup></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.article>
  </div>
}
