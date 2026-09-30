'use client'

import { useRef, useState } from 'react'
import { ChevronDown, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PriorityBadge, StatusBadge, UserAvatar } from '@/components/ui/hostlink'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PRIORITIES, type Priority, type Status, type Task, type User } from '@/lib/types'
import { allowedTransitions } from '@/lib/utils'

export function AssigneePicker({ value, users, disabled, onChange }: { value: string; users: User[]; disabled?: boolean; onChange: (id: string) => void }) {
  const user = users.find(user => user.id === value)
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant="secondary" disabled={disabled} aria-label={`Assignee: ${user?.name ?? 'Choose member'}`} className="w-full justify-start" />}>
    {user && <UserAvatar user={user} size="sm" />}<span className="flex-1 truncate text-left">{user?.name ?? 'Choose member'}</span><ChevronDown />
  </DropdownMenuTrigger><DropdownMenuContent><DropdownMenuGroup>{users.map(user => <DropdownMenuItem key={user.id} onClick={() => onChange(user.id)}><UserAvatar user={user} size="sm" />{user.name}</DropdownMenuItem>)}</DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
}
export function PriorityPicker({ value, disabled, onChange }: { value: Priority; disabled?: boolean; onChange: (priority: Priority) => void }) {
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant="secondary" disabled={disabled} aria-label={`Priority: ${value}`} className="w-full justify-between" />}><PriorityBadge priority={value} /><ChevronDown /></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuGroup>{PRIORITIES.map(priority => <DropdownMenuItem key={priority} onClick={() => onChange(priority)}><PriorityBadge priority={priority} /></DropdownMenuItem>)}</DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
}
export function DrawerStatus({ task, disabled, onChange }: { task: Task; disabled?: boolean; onChange: (status: Status) => void }) {
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant="secondary" disabled={disabled} aria-label={`Change status of ${task.key}`} />}><StatusBadge status={task.status} /><ChevronDown /></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuGroup>{allowedTransitions(task.status).map(status => <DropdownMenuItem key={status} onClick={() => onChange(status)}><StatusBadge status={status} /></DropdownMenuItem>)}</DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
}

export function InlineTaskText({ value, label, multiline, disabled, onSave }: { value: string; label: string; multiline?: boolean; disabled?: boolean; onSave: (value: string) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')
  const cancelled = useRef(false)
  const saving = useRef(false)
  async function save() {
    if (cancelled.current || saving.current) return
    if (!multiline && !draft.trim()) { setError('Title is required.'); return }
    if (draft.trim() === value) { setEditing(false); return }
    saving.current = true
    const saved = await onSave(draft)
    saving.current = false
    if (saved) { setEditing(false); setError('') }
    else setError('Not saved. Your draft is kept here; leave the field to retry.')
  }
  if (!editing) return <button type="button" disabled={disabled} aria-label={`Edit ${label.toLowerCase()}`} onClick={() => { cancelled.current = false; setDraft(value); setEditing(true); setError('') }} className={`group flex w-full items-start gap-2 rounded-md p-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring ${multiline ? 'min-h-20 text-[13px]' : 'text-xl font-semibold leading-7 text-strong'}`}><span className={`min-w-0 flex-1 whitespace-pre-wrap break-words ${!value ? 'text-muted-foreground' : ''}`}>{value || 'Add a description…'}</span><Pencil className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" /></button>
  const shared = { autoFocus: true, value: draft, disabled, 'aria-label': label, 'aria-invalid': !!error, maxLength: multiline ? 10000 : 200, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setDraft(event.target.value); setError('') }, onBlur: () => void save(), onKeyDown: (event: React.KeyboardEvent) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelled.current = true; setEditing(false) }
    if (event.key === 'Enter' && (!multiline || event.ctrlKey || event.metaKey)) { event.preventDefault(); void save() }
  } }
  return <div className="flex flex-col gap-1">{multiline ? <Textarea {...shared} rows={5} /> : <Input {...shared} />}<p className="text-[11px] text-muted-foreground">Saves when you leave this field. Esc to cancel.</p>{error && <p role="alert" className="text-xs text-danger">{error}</p>}</div>
}
