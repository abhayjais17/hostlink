'use client'

import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { IconButton, LoadingButton } from '@/components/ui/hostlink'
import { quickAddTask } from '@/lib/api'

export function QuickAdd({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const saving = useRef(false)
  async function submit() {
    if (saving.current) return
    if (!title.trim()) { setError('Give your task a title.'); input.current?.focus(); return }
    saving.current = true
    setPending(true)
    setError('')
    try {
      const task = await quickAddTask(projectId, title)
      setTitle('')
      toast.success(`${task.key} added to Backlog`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create this task.'
      setError(message)
      toast.error(message)
    } finally {
      saving.current = false
      setPending(false)
      requestAnimationFrame(() => input.current?.focus())
    }
  }
  if (!open) return <Button variant="ghost" className="w-full justify-start" onClick={() => onOpenChange(true)}><Plus data-icon="inline-start" />Add task</Button>
  return <div className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-surface p-3 shadow-sm">
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={`quick-add-${projectId}`}>Task title</FieldLabel>
      <Input ref={input} id={`quick-add-${projectId}`} autoFocus value={title} disabled={pending} maxLength={200} placeholder="What needs to be done?" aria-invalid={!!error} aria-describedby={error ? 'quick-add-error' : 'quick-add-hint'} onChange={event => { setTitle(event.target.value); setError('') }} onKeyDown={event => {
        if (event.nativeEvent.isComposing || event.keyCode === 229) return
        if (event.key === 'Enter') { event.preventDefault(); void submit() }
        if (event.key === 'Escape' && !saving.current) { setTitle(''); setError(''); onOpenChange(false) }
      }} />
      {error ? <p id="quick-add-error" role="alert" className="text-xs text-danger">{error}</p> : <FieldDescription id="quick-add-hint">Normal priority · due in 7 days. Assigned to you if you are a member, otherwise the first project member.</FieldDescription>}
    </Field>
    <div className="flex items-center gap-2"><LoadingButton pending={pending} onClick={() => void submit()}>Add task</LoadingButton><IconButton label="Cancel quick add" disabled={pending} onClick={() => { setTitle(''); setError(''); onOpenChange(false) }}><X /></IconButton><span className="ml-auto text-xs text-muted-foreground">Enter to add</span></div>
  </div>
}
