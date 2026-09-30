'use client'

import { useRef, useState, type RefObject } from 'react'
import { format, parseISO } from 'date-fns'
import { AlertCircle, Ellipsis, Link2, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { IconButton, LoadingButton, Modal, SavedIndicator } from '@/components/ui/hostlink'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { deleteTask, moveTask, updateTask } from '@/lib/api'
import { useProject, useTask, useUsers } from '@/lib/hooks'
import { daysOverdue, isOverdue } from '@/lib/utils'
import type { Task, UpdateTaskInput } from '@/lib/types'
import { AssigneePicker, DrawerStatus, InlineTaskText, PriorityPicker } from './task-fields'
import { TaskActivity } from './task-activity'

type Props = { taskId: string; open: boolean; onClosed: () => void; onClose: () => void; onEdit: () => void; returnFocus: RefObject<HTMLElement | null> }
export function TaskDrawer({ taskId, open, onClosed, onClose, onEdit, returnFocus }: Props) {
  const { data: task, error, mutate } = useTask(taskId)
  const [pending, setPending] = useState(false)
  return <Dialog open={open} onOpenChangeComplete={open => { if (!open) onClosed() }} onOpenChange={open => { if (!open && !pending) onClose() }}><DialogContent className="task-detail-drawer" style={{ translate: 'none' }} showCloseButton={false} finalFocus={returnFocus}>
    {error ? <div className="flex flex-col gap-4 p-6"><DialogTitle>Task unavailable</DialogTitle><DialogDescription>This task may have been deleted or could not be loaded.</DialogDescription><Button onClick={() => void mutate()}>Retry</Button><Button variant="secondary" onClick={onClose}>Close</Button></div> : !task ? <div className="flex flex-col gap-4 p-6" aria-busy="true"><DialogTitle>Loading task</DialogTitle><Skeleton className="h-10" /><Skeleton className="h-40" /><Button variant="secondary" onClick={onClose}>Close</Button></div> : <DrawerDetails task={task} pending={pending} setPending={setPending} onClose={onClose} onEdit={onEdit} />}
  </DialogContent></Dialog>
}
function DrawerDetails({ task, pending, setPending, onClose, onEdit }: { task: Task; pending: boolean; setPending: (value: boolean) => void; onClose: () => void; onEdit: () => void }) {
  const { data: project, error: projectError, mutate: reloadProject } = useProject(task.projectId)
  const { data: users, error: usersError, mutate: reloadUsers } = useUsers()
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const saving = useRef(false)
  const members = (users ?? []).filter(user => project?.memberIds.includes(user.id))
  async function save(fields: UpdateTaskInput) {
    if (saving.current) return false
    saving.current = true; setPending(true); setSaved(false)
    try {
      if (fields.status) await moveTask(task.id, fields.status)
      else await updateTask(task.id, fields)
      setSaved(true); return true
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save this change.'); return false }
    finally { saving.current = false; setPending(false) }
  }
  async function remove() {
    if (saving.current) return
    saving.current = true; setPending(true)
    try { await deleteTask(task.id); toast.success(`${task.key} deleted`); onClose() }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not delete task.') }
    finally { saving.current = false; setPending(false) }
  }
  async function copyLink() {
    const url = new URL(`/projects/${task.projectId}/board`, window.location.origin)
    url.searchParams.set('task', task.id)
    try { await navigator.clipboard.writeText(url.href); toast.success('Task link copied', { description: 'Demo-only tasks are available until this tab is reloaded.' }) }
    catch { toast.error('Clipboard unavailable. Please try again in a secure browser tab.') }
  }
  return <>
    <header className="flex shrink-0 flex-wrap items-center gap-1.5 border-b px-3 py-3 sm:gap-2 sm:px-4"><DialogTitle className="mr-auto text-xs text-muted-foreground">{task.key}</DialogTitle><IconButton label="Copy task link" onClick={() => void copyLink()}><Link2 /></IconButton><DrawerStatus task={task} disabled={pending} onChange={status => void save({ status })} /><DropdownMenu><DropdownMenuTrigger render={<IconButton label="Task actions" disabled={pending}><Ellipsis /></IconButton>}><Ellipsis /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuGroup><DropdownMenuItem onClick={onEdit}><Pencil />Edit task</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}><Trash2 />Delete task</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu><IconButton label="Close task" disabled={pending} onClick={onClose}><X /></IconButton></header>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="flex flex-col gap-2 px-4 pt-5"><DialogDescription className="text-xs">{project?.name ?? 'Project'} / Task details</DialogDescription><InlineTaskText label="Title" value={task.title} disabled={pending} onSave={title => save({ title })} /><div className="flex min-h-6 justify-end">{pending ? <span role="status" className="text-xs text-muted-foreground">Saving…</span> : saved && <SavedIndicator visible />}</div></div>
      <div className="grid grid-cols-1 gap-6 px-5 pb-6 md:grid-cols-[minmax(0,1fr)_180px] md:gap-5">
        <div className="flex min-w-0 flex-col gap-5"><section aria-label="Description"><h3 className="mb-2 text-sm font-semibold">Description</h3><InlineTaskText label="Description" multiline value={task.description ?? ''} disabled={pending} onSave={description => save({ description })} /></section><Separator />{users && <TaskActivity taskId={task.id} users={users} />}</div>
        <aside aria-label="Task details" className="order-first flex min-w-0 flex-col gap-4 rounded-lg border bg-canvas/50 p-3 md:order-last md:self-start"><h3 className="text-xs font-semibold">Details</h3>
          {projectError || usersError ? <div role="alert"><p className="text-xs">Details could not be loaded.</p><Button variant="secondary" onClick={() => { void reloadProject(); void reloadUsers() }}>Retry</Button></div> : <FieldGroup className="gap-4">
            <Field><FieldLabel>Assignee</FieldLabel><AssigneePicker value={task.assigneeId} users={members} disabled={pending || !project || !users} onChange={assigneeId => void save({ assigneeId })} /></Field>
            <Field><FieldLabel>Priority</FieldLabel><PriorityPicker value={task.priority} disabled={pending} onChange={priority => void save({ priority })} /></Field>
            <Field><FieldLabel>Status</FieldLabel><DrawerStatus task={task} disabled={pending} onChange={status => void save({ status })} /></Field>
            <Field><FieldLabel htmlFor="drawer-due-date">Due date</FieldLabel><Input id="drawer-due-date" type="date" value={task.dueDate} disabled={pending} onChange={event => { if (event.target.value) void save({ dueDate: event.target.value }) }} />{isOverdue(task) && <p className="flex items-start gap-1 text-[11px] leading-4 text-danger"><AlertCircle className="size-3.5 shrink-0" />Overdue by {daysOverdue(task)} {daysOverdue(task) === 1 ? 'day' : 'days'}</p>}</Field>
          </FieldGroup>}
          <Separator /><dl className="flex flex-col gap-3 text-[11px] leading-4"><div><dt className="text-muted-foreground">Created</dt><dd className="mt-1"><time dateTime={task.createdAt}>{format(parseISO(task.createdAt), 'MMM d, yyyy · HH:mm')}</time></dd></div><div><dt className="text-muted-foreground">Last moved</dt><dd className="mt-1"><time dateTime={task.movedAt}>{format(parseISO(task.movedAt), 'MMM d, yyyy · HH:mm')}</time></dd></div><div><dt className="text-muted-foreground">Project</dt><dd className="mt-1 break-words">{project?.name ?? 'Loading…'}</dd></div></dl>
        </aside>
      </div>
    </div>
    <Modal children={null} open={confirmDelete} onOpenChange={open => { if (!open && !pending) setConfirmDelete(false) }} title={`Delete ${task.key}?`} description="This removes the task, its comments, and its history. This cannot be undone." footer={<><Button variant="secondary" disabled={pending} onClick={() => setConfirmDelete(false)}>Cancel</Button><LoadingButton variant="destructive" pending={pending} onClick={() => void remove()}>Delete task</LoadingButton></>} />
  </>
}
