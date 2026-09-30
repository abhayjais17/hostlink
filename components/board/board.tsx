'use client'

import { useRef, useState } from 'react'
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, pointerWithin, useSensor, useSensors, type CollisionDetection, type DragEndEvent, type KeyboardCoordinateGetter } from '@dnd-kit/core'
import { useReducedMotion } from 'framer-motion'
import { AlertCircle, ArrowRight, SearchX } from 'lucide-react'
import { TaskToolbar } from '@/components/task/task-toolbar'
import { useTaskWorkspace } from '@/components/task/task-workspace'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Column } from './column'
import { QuickAdd } from './quick-add'
import { TaskCard, TaskCardContent, type CardFeedback } from './task-card'
import { clearTaskFilters, moveTask } from '@/lib/api'
import { useBoardCommentCounts, useTaskFilters, useTasks, useUsers } from '@/lib/hooks'
import { allowedTransitions, cn, isOverdue, statusLabels } from '@/lib/utils'
import { STATUSES, type Status, type Task } from '@/lib/types'

const collisionDetection: CollisionDetection = args => {
  const columns = { ...args, droppableContainers: args.droppableContainers.filter(container => container.data.current?.column) }
  return args.pointerCoordinates ? pointerWithin(columns) : closestCenter(columns)
}
const keyboardCoordinates: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.code)) return undefined
  event.preventDefault()
  const status = (context.over?.id ?? context.active?.data.current?.status) as Status
  const next = STATUSES[STATUSES.indexOf(status) + (event.code === 'ArrowRight' ? 1 : -1)]
  const rect = next ? context.droppableRects.get(next) : undefined
  if (!rect || !context.collisionRect) return currentCoordinates
  return { x: rect.left + (rect.width - context.collisionRect.width) / 2, y: rect.top + 60 }
}


export function Board({ projectId }: { projectId: string }) {
  const { openCreate } = useTaskWorkspace()
  const filters = useTaskFilters(projectId)
  const { data: tasks, error: tasksError, mutate: reloadTasks } = useTasks(projectId, filters)
  const hasFilters = !!(filters.search || filters.assigneeIds?.length || filters.priorities?.length || filters.statuses?.length)
  const { data: users, error: usersError, mutate: reloadUsers } = useUsers()
  const { data: comments, error: commentsError, mutate: reloadComments } = useBoardCommentCounts(projectId)
  const reduced = useReducedMotion()
  const [active, setActive] = useState<Task | null>(null)
  const [overStatus, setOverStatus] = useState<Status | null>(null)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<CardFeedback>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const saving = useRef(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }))

  async function changeStatus(task: Task, status: Status) {
    if (saving.current || task.status === status) return
    saving.current = true
    setPending(true)
    try {
      await moveTask(task.id, status)
      setFeedback({ id: task.id, kind: 'success', nonce: Date.now() })
      toast.success(`${task.key} moved to ${statusLabels[status]}`)
    } catch (error) {
      setFeedback({ id: task.id, kind: 'rejected', nonce: Date.now() })
      toast.error(error instanceof Error ? error.message : 'Could not move this task.')
    } finally { saving.current = false; setPending(false) }
  }
  function onDragEnd({ active: dragged, over }: DragEndEvent) {
    const task = tasks?.find(task => task.id === dragged.id)
    setActive(null)
    setOverStatus(null)
    if (task && over && STATUSES.includes(over.id as Status)) void changeStatus(task, over.id as Status)
  }
  function openComposer() {
    setComposerOpen(true)
    requestAnimationFrame(() => document.getElementById(`quick-add-${projectId}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'instant' : 'smooth' }))
  }
  if (tasksError || usersError || commentsError) return <section className="flex flex-col items-start gap-3 p-7" role="alert"><h2 className="font-semibold">Could not load the board</h2><p className="text-muted-foreground">Your tasks have not been changed. Try loading them again.</p><Button variant="secondary" onClick={() => { void reloadTasks(); void reloadUsers(); void reloadComments() }}>Try again</Button></section>
  if (!tasks || !users || !comments) return <div className="flex flex-1 gap-4 overflow-hidden p-4 sm:p-7" aria-label="Loading board" aria-busy="true">{STATUSES.map(status => <div key={status} className="flex min-w-64 flex-1 flex-col gap-3"><Skeleton className="h-12 w-full" />{[0, 1, 2].map(index => <Skeleton key={index} className="h-48 w-full" />)}</div>)}</div>
  const overdueCount = tasks.filter(task => isOverdue(task)).length
  return <section aria-label="Project Kanban board" className="flex min-h-[480px] flex-1 flex-col">
    <TaskToolbar projectId={projectId} view="board" onAdd={() => openCreate(projectId)} />
    <div className="flex items-center gap-3 px-4 pt-4 sm:px-7"><h2 className="text-[13px] font-semibold">Board</h2><span className="text-xs tabular-nums text-muted-foreground">{tasks.length} tasks</span>{overdueCount > 0 && <span className="inline-flex items-center gap-1 text-xs text-danger"><AlertCircle className="size-3.5" />{overdueCount} overdue</span>}</div>
    {hasFilters && tasks.length === 0 && <Empty className="mx-4 mt-4 border bg-surface sm:mx-7"><EmptyHeader><EmptyMedia variant="icon"><SearchX /></EmptyMedia><EmptyTitle>No tasks match your filters</EmptyTitle><EmptyDescription>Clear your filters to see every task on the board.</EmptyDescription></EmptyHeader><EmptyContent><Button variant="secondary" onClick={() => clearTaskFilters(projectId)}>Clear filters</Button></EmptyContent></Empty>}
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 pb-3 text-xs text-muted-foreground sm:px-7"><p>Drag by the grip, or use a task&apos;s <span className="font-medium text-body">Move to…</span> menu.</p><span className="inline-flex items-center gap-1.5">Backlog <ArrowRight className="size-3" /> In Progress <ArrowRight className="size-3" /> Review <ArrowRight className="size-3" /> Done</span></div>
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={({ active }) => { setActive(tasks.find(task => task.id === active.id) ?? null); setFeedback(null) }} onDragOver={({ over }) => setOverStatus(over?.id as Status ?? null)} onDragEnd={onDragEnd} onDragCancel={() => { setActive(null); setOverStatus(null) }} accessibility={{ screenReaderInstructions: { draggable: 'Press Space to pick up a task. Use Left and Right arrows to choose a column, Space to drop, or Escape to cancel. You can also use the Move to menu.' }, announcements: {
      onDragStart: ({ active }) => `Picked up ${tasks.find(task => task.id === active.id)?.key ?? 'task'}. Use Left and Right arrows to choose a column.`,
      onDragOver: ({ over }) => over ? `Over ${statusLabels[over.id as Status]}.${active && !allowedTransitions(active.status).includes(over.id as Status) && active.status !== over.id ? ' This move is not allowed.' : ''}` : 'Outside the board. Dropping will cancel the move.',
      onDragEnd: ({ over }) => over ? `Dropped on ${statusLabels[over.id as Status]}. The move will be validated.` : 'Move cancelled.',
      onDragCancel: () => 'Move cancelled.',
    } }}>
      <div className="flex h-[calc(100dvh-340px)] min-h-[360px] min-w-0 flex-1 snap-x snap-proximity scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain sm:scroll-px-7 px-4 pt-1 pb-5 sm:px-7" aria-label="Kanban columns">
        {STATUSES.map(status => <Column key={status} status={status} tasks={tasks.filter(task => task.status === status)} dragging={!!active} valid={!!active && (active.status === status || allowedTransitions(active.status).includes(status))} over={overStatus === status} onAdd={status === 'backlog' ? openComposer : () => openCreate(projectId, status)}>
          {tasks.filter(task => task.status === status).map(task => <TaskCard key={task.id} task={task} user={users.find(user => user.id === task.assigneeId)} commentCount={comments[task.id] ?? 0} pending={pending} feedback={feedback} onMove={(task, status) => void changeStatus(task, status)} />)}
          {status === 'backlog' && <div hidden={!!active}><QuickAdd projectId={projectId} open={composerOpen} onOpenChange={setComposerOpen} /></div>}
        </Column>)}
      </div>
      <DragOverlay dropAnimation={reduced ? null : { duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        {active && <div aria-hidden="true" className={cn('pointer-events-none flex flex-col gap-3 rounded-lg border bg-surface p-3 shadow-drag', !reduced && 'rotate-2 scale-[1.02]', isOverdue(active) && 'border-l-[3px] border-l-danger bg-danger-soft')}><TaskCardContent task={active} user={users.find(user => user.id === active.assigneeId)} commentCount={comments[active.id] ?? 0} /><div className="h-10" /></div>}
      </DragOverlay>
    </DndContext>
  </section>
}
