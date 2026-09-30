'use client'

import { useRef, useState, type FormEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { LoadingButton, UserAvatar } from '@/components/ui/hostlink'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { createProject } from '@/lib/api'
import { useUsers } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/types'
import { projectColors, ProjectIcon } from './project-list'

export function NewProjectModal({ onClose, onCreated, defaultMemberId }: {
  onClose: () => void; onCreated: (project: Project) => void; defaultMemberId?: string
}) {
  const { data: users, error: usersError, mutate: reloadUsers } = useUsers()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('teal')
  const [memberIds, setMemberIds] = useState<string[]>(defaultMemberId ? [defaultMemberId] : [])
  const [errors, setErrors] = useState<{ name?: string; members?: string; form?: string }>({})
  const [pending, setPending] = useState(false)
  const saving = useRef(false)
  const nameRef = useRef<HTMLInputElement>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving.current) return
    const nextErrors = { name: name.trim() ? undefined : 'Project name is required.', members: memberIds.length ? undefined : 'Select at least one project member.' }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.members) {
      if (nextErrors.name) nameRef.current?.focus()
      return
    }
    saving.current = true
    setPending(true)
    try {
      const project = await createProject({ name, description, color, memberIds })
      toast.success('Project created', { description: `${project.name} is ready for your team.` })
      onCreated(project)
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create the project. Please try again.'
      setErrors({ form: message })
      toast.error('Project could not be created', { description: message })
    } finally {
      saving.current = false
      setPending(false)
    }
  }

  return <Dialog open onOpenChange={open => { if (!open && !saving.current) onClose() }}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg" showCloseButton={!pending}>
      <DialogHeader><DialogTitle>New project</DialogTitle><DialogDescription>Give your team a shared space to bring work together.</DialogDescription></DialogHeader>
      <form id="new-project-form" noValidate onSubmit={submit} onKeyDown={event => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }}>
        <FieldGroup className="gap-4">
          <Field data-invalid={!!errors.name} data-disabled={pending}><FieldLabel htmlFor="project-name">Project name <span aria-hidden="true" className="text-danger">*</span></FieldLabel><Input ref={nameRef} autoFocus id="project-name" name="name" required maxLength={100} placeholder="e.g. Website Revamp" value={name} disabled={pending} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'project-name-error' : undefined} onChange={event => { setName(event.target.value); setErrors(current => ({ ...current, name: undefined })) }} />{errors.name && <FieldError id="project-name-error">{errors.name}</FieldError>}</Field>
          <Field data-disabled={pending}><FieldLabel htmlFor="project-description">Description <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel><Textarea id="project-description" name="description" placeholder="What is this project about?" value={description} maxLength={2000} rows={3} disabled={pending} onChange={event => setDescription(event.target.value)} /></Field>
          <FieldSet disabled={pending}><FieldLegend variant="label">Project color</FieldLegend><div className="flex items-center gap-4"><ProjectIcon name={name} color={color} /><ToggleGroup aria-label="Project color" value={[color]} onValueChange={values => { if (values.length) setColor(String(values[0])) }} disabled={pending} spacing={1}>{projectColors.map(option => <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label}><span aria-hidden="true" className={cn('flex size-6 items-center justify-center rounded-full text-primary-foreground', option.className)}>{color === option.value && <Check className="size-3.5" />}</span></ToggleGroupItem>)}</ToggleGroup></div></FieldSet>
          <FieldSet disabled={pending} aria-describedby={errors.members ? 'project-members-error' : 'project-members-hint'}><FieldLegend variant="label">Members <span aria-hidden="true" className="text-danger">*</span></FieldLegend><FieldDescription id="project-members-hint">Choose the people working on this project.</FieldDescription>
            {usersError ? <div role="alert" className="flex items-center justify-between gap-2"><p className="text-xs text-danger">Team members could not be loaded.</p><Button type="button" variant="secondary" onClick={() => void reloadUsers()}>Retry</Button></div> : !users ? <div aria-label="Loading members" aria-busy="true" className="flex flex-col gap-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div> : <FieldGroup className="gap-1">{users.map(user => <Field key={user.id} orientation="horizontal" data-invalid={!!errors.members} data-disabled={pending} className="rounded-md border p-2">
              <Checkbox id={`project-member-${user.id}`} checked={memberIds.includes(user.id)} disabled={pending} aria-invalid={!!errors.members} onCheckedChange={checked => { setMemberIds(ids => checked ? [...ids, user.id] : ids.filter(id => id !== user.id)); setErrors(current => ({ ...current, members: undefined })) }} /><FieldLabel htmlFor={`project-member-${user.id}`} className="flex-1 items-center gap-2"><UserAvatar user={user} size="sm" /><FieldContent><span>{user.name}</span><span className="text-xs font-normal text-muted-foreground">{user.role}</span></FieldContent></FieldLabel>
            </Field>)}</FieldGroup>}
            {errors.members && <FieldError id="project-members-error">{errors.members}</FieldError>}
          </FieldSet>
          {errors.form && <p role="alert" className="text-xs text-danger">{errors.form}</p>}
        </FieldGroup>
      </form>
      <DialogFooter><Button type="button" variant="secondary" size="lg" disabled={pending} onClick={onClose}>Cancel</Button><LoadingButton type="submit" form="new-project-form" size="lg" pending={pending} disabled={!users || !!usersError}><Plus data-icon="inline-start" />Create project</LoadingButton></DialogFooter>
    </DialogContent>
  </Dialog>
}
