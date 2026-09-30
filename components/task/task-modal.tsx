'use client'

import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LoadingButton } from '@/components/ui/hostlink'
import { Skeleton } from '@/components/ui/skeleton'
import { createTask, updateTask } from '@/lib/api'
import { useProjects, useTask, useUsers } from '@/lib/hooks'
import { PRIORITIES, STATUSES, type Project, type Status, type Task, type User } from '@/lib/types'
import { allowedTransitions, statusLabels, transitionError } from '@/lib/utils'

type Request = { projectId?: string; taskId?: string; status?: Status }
type Props = { request: Request; onClose: () => void; returnFocus: RefObject<HTMLElement | null> }
const selectClass = 'h-9 w-full min-w-0 rounded-md border bg-surface px-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-invalid:border-danger'

export function TaskModal(props: Props) {
  return props.request.taskId ? <EditTaskModal {...props} taskId={props.request.taskId} /> : <LoadedTaskModal {...props} />
}
function EditTaskModal(props: Props & { taskId: string }) {
  const { data: task, error, mutate } = useTask(props.taskId)
  if (!task || error) return <Dialog open onOpenChange={open => { if (!open) props.onClose() }}><DialogContent finalFocus={props.returnFocus}><DialogTitle>Edit task</DialogTitle>{error ? <div role="alert"><p>Could not load this task.</p><Button onClick={() => void mutate()}>Retry</Button></div> : <Skeleton aria-label="Loading task" className="h-64" />}</DialogContent></Dialog>
  return <LoadedTaskModal {...props} task={task} />
}
function LoadedTaskModal({ request, task, onClose, returnFocus }: Props & { task?: Task }) {
  const { data: projects, error: projectsError, mutate: reloadProjects } = useProjects()
  const { data: users, error: usersError, mutate: reloadUsers } = useUsers()
  const [pending, setPending] = useState(false)
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose() }}><DialogContent finalFocus={returnFocus} showCloseButton={!pending} className="task-edit-modal max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
    <DialogHeader><DialogTitle>{task ? `Edit ${task.key}` : 'Create task'}</DialogTitle><DialogDescription>{task ? 'Update the details. Status changes follow your project workflow.' : 'Make the next step clear. Give it an owner and a due date.'}</DialogDescription></DialogHeader>
    {projectsError || usersError ? <div role="alert" className="flex flex-col gap-3"><p>Could not load project members.</p><Button onClick={() => { void reloadProjects(); void reloadUsers() }}>Retry</Button></div> : !projects || !users ? <Skeleton aria-label="Loading task form" className="h-80" /> : <TaskForm request={request} task={task} projects={projects} users={users} pending={pending} setPending={setPending} onClose={onClose} />}
  </DialogContent></Dialog>
}
function TaskForm({ request, task, projects, users, pending, setPending, onClose }: { request: Request; task?: Task; projects: Project[]; users: User[]; pending: boolean; setPending: (value: boolean) => void; onClose: () => void }) {
  const [projectId, setProjectId] = useState(task?.projectId ?? request.projectId ?? projects[0]?.id ?? '')
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '')
  const [priority, setPriority] = useState(task?.priority ?? 'normal')
  const [status, setStatus] = useState<Status>(task?.status ?? request.status ?? 'backlog')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const saving = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const members = users.filter(user => projects.find(project => project.id === projectId)?.memberIds.includes(user.id))
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving.current) return
    const invalid: Record<string, string> = {}
    if (!projectId) invalid.project = 'Choose a project.'
    if (!title.trim()) invalid.title = 'Title is required.'
    if (!members.some(user => user.id === assigneeId)) invalid.assignee = 'Choose a project member.'
    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) invalid.date = 'Due date is required.'
    setErrors(invalid)
    if (Object.keys(invalid).length) { requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return }
    saving.current = true; setPending(true)
    try {
      const fields = { title, description, assigneeId, priority, status, dueDate }
      const result = task ? await updateTask(task.id, fields) : await createTask({ ...fields, projectId })
      toast.success(`${result.key} ${task ? 'updated' : 'created'}`)
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save this task.'
      setErrors({ form: message }); toast.error(message)
    } finally { saving.current = false; setPending(false) }
  }
  return <>
    <form ref={formRef} id="task-form" noValidate onSubmit={submit} onKeyDown={event => {
      if (event.nativeEvent.isComposing || event.keyCode === 229) { if (event.key === 'Enter') event.preventDefault(); return }
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); event.currentTarget.requestSubmit() }
    }}>
      <FieldGroup className="gap-4">
        {!request.projectId && !task && <Field data-invalid={!!errors.project}><FieldLabel htmlFor="task-project">Project</FieldLabel><select id="task-project" className={selectClass} value={projectId} disabled={pending} aria-invalid={!!errors.project} onChange={event => { setProjectId(event.target.value); setAssigneeId('') }}>{projects.length === 0 && <option value="">Create a project first</option>}{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>{errors.project && <FieldError>{errors.project}</FieldError>}</Field>}
        <Field data-invalid={!!errors.title}><FieldLabel htmlFor="task-title">Title <span className="text-danger">*</span></FieldLabel><Input id="task-title" autoFocus required maxLength={200} value={title} disabled={pending} placeholder="What needs to be done?" aria-invalid={!!errors.title} aria-describedby={errors.title ? 'task-title-error' : undefined} onChange={event => { setTitle(event.target.value); setErrors(previous => ({ ...previous, title: '' })) }} />{errors.title && <FieldError id="task-title-error">{errors.title}</FieldError>}</Field>
        <Field><FieldLabel htmlFor="task-description">Description</FieldLabel><Textarea id="task-description" rows={4} maxLength={10000} value={description} disabled={pending} placeholder="Add context, requirements, or useful links…" onChange={event => setDescription(event.target.value)} /></Field>
        <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.assignee}><FieldLabel htmlFor="task-assignee">Assignee <span className="text-danger">*</span></FieldLabel><select id="task-assignee" className={selectClass} value={assigneeId} disabled={pending} required aria-invalid={!!errors.assignee} aria-describedby={errors.assignee ? 'task-assignee-error' : undefined} onChange={event => { setAssigneeId(event.target.value); setErrors(previous => ({ ...previous, assignee: '' })) }}><option value="">Choose member</option>{members.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select>{errors.assignee && <FieldError id="task-assignee-error">{errors.assignee}</FieldError>}</Field>
          <Field><FieldLabel htmlFor="task-priority">Priority</FieldLabel><select id="task-priority" className={selectClass} value={priority} disabled={pending} onChange={event => setPriority(event.target.value as Task['priority'])}>{PRIORITIES.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></Field>
          <Field data-invalid={!!errors.date}><FieldLabel htmlFor="task-date">Due date <span className="text-danger">*</span></FieldLabel><Input id="task-date" type="date" required value={dueDate} disabled={pending} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'task-date-error' : undefined} onChange={event => { setDueDate(event.target.value); setErrors(previous => ({ ...previous, date: '' })) }} />{errors.date && <FieldError id="task-date-error">{errors.date}</FieldError>}</Field>
          <Field><FieldLabel htmlFor="task-status">Status</FieldLabel><select id="task-status" className={selectClass} value={status} disabled={pending} onChange={event => setStatus(event.target.value as Status)}>{STATUSES.map(value => { const disabled = !!task && value !== task.status && !allowedTransitions(task.status).includes(value); return <option key={value} value={value} disabled={disabled}>{statusLabels[value]}{disabled ? ' (not allowed)' : ''}</option> })}</select>{task && status !== task.status && !allowedTransitions(task.status).includes(status) && <FieldError>{transitionError(task.status, status)}</FieldError>}</Field>
        </FieldGroup>
        {errors.form && <p role="alert" className="text-xs text-danger">{errors.form}</p>}
      </FieldGroup>
    </form>
    <DialogFooter><span className="mr-auto hidden self-center text-[11px] text-muted-foreground sm:inline">Ctrl / ⌘ Enter to save</span><Button variant="secondary" size="lg" disabled={pending} onClick={onClose}>Cancel</Button><LoadingButton type="submit" form="task-form" size="lg" pending={pending} disabled={projects.length === 0}>{task ? 'Save changes' : 'Create task'}</LoadingButton></DialogFooter>
  </>
}
