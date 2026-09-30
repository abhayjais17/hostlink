'use client'

import type { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion, useReducedMotion } from 'framer-motion'
import { Ban, Ellipsis, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { IconButton, StatusDot } from '@/components/ui/hostlink'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn, statusLabels } from '@/lib/utils'
import type { Status, Task } from '@/lib/types'

const statusBorders: Record<Status, string> = { backlog: 'border-t-status-backlog', in_progress: 'border-t-status-progress', review: 'border-t-status-review', done: 'border-t-status-done' }
export function Column({ status, tasks, dragging, valid, over, children, onAdd }: { status: Status; tasks: Task[]; dragging: boolean; valid: boolean; over: boolean; children: ReactNode; onAdd: () => void }) {
  const { setNodeRef } = useDroppable({ id: status, data: { status, column: true } })
  const reduced = useReducedMotion()
  return <section ref={setNodeRef} data-column={status} data-drop-state={dragging ? valid ? 'valid' : 'invalid' : 'idle'} aria-labelledby={`column-${status}`} className={cn('flex h-full w-[280px] shrink-0 snap-start flex-col rounded-lg border border-t-[3px] bg-muted/70 transition-[background-color,opacity,outline-color] duration-150 lg:w-auto lg:min-w-[250px] lg:flex-1', statusBorders[status], dragging && valid && 'bg-brand-50 outline-1 outline-dashed outline-primary/50', dragging && !valid && 'cursor-not-allowed opacity-50', over && valid && 'outline-2 outline-primary')}>
    <header className="sticky top-0 flex shrink-0 items-center gap-2 rounded-t-lg bg-surface/90 px-3 py-3"><StatusDot status={status} /><h2 id={`column-${status}`} className="text-[13px] font-semibold">{statusLabels[status]}</h2><motion.span key={tasks.length} initial={false} animate={{ scale: reduced ? 1 : [1, 1.15, 1] }} transition={{ duration: 0.2 }}><Badge variant="secondary" aria-label={`${tasks.length} tasks`} className="tabular-nums">{tasks.length}</Badge></motion.span><div className="ml-auto flex items-center"><IconButton label={`Add task to ${statusLabels[status]}`} onClick={onAdd}><Plus /></IconButton><DropdownMenu><DropdownMenuTrigger render={<IconButton label={`${statusLabels[status]} column actions`}><Ellipsis /></IconButton>}><Ellipsis /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuGroup><DropdownMenuItem onClick={onAdd}><Plus />Add task</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu></div></header>
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-2.5">
      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>{children}</SortableContext>
      {dragging && over && <div aria-hidden="true" className={cn('flex min-h-24 shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 text-xs', valid ? 'border-primary/40 bg-brand-50 text-primary' : 'border-danger/40 bg-danger-soft text-danger')}>{valid ? 'Drop to move here' : <><Ban className="size-4" />Move not allowed</>}</div>}
      {!tasks.length && !dragging && <p className="py-8 text-center text-xs text-muted-foreground">No tasks here yet</p>}
    </div>
  </section>
}
