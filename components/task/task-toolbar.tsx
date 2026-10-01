'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, LayoutGrid, List, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/hostlink'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { clearTaskFilters, setTaskFilters } from '@/lib/api'
import { useProject, useTaskFilters, useUsers } from '@/lib/hooks'
import { PRIORITIES, STATUSES, type TaskFilters } from '@/lib/types'
import { cn, statusLabels } from '@/lib/utils'

type FilterKey = 'assigneeIds' | 'priorities' | 'statuses'

export function TaskToolbar({ projectId, view, onAdd }: { projectId: string; view: 'board' | 'list'; onAdd: () => void }) {
  const filters = useTaskFilters(projectId)
  const { data: users } = useUsers()
  const { data: project } = useProject(projectId)
  const reduced = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)
  const groups = [
    { key: 'assigneeIds' as const, label: 'Assignee', options: (users ?? []).filter(user => project?.memberIds?.includes(user.id)).map(user => ({ value: user.id, label: user.name, user })) },
    { key: 'priorities' as const, label: 'Priority', options: PRIORITIES.map(value => ({ value, label: value[0].toUpperCase() + value.slice(1), user: undefined })) },
    { key: 'statuses' as const, label: 'Status', options: STATUSES.map(value => ({ value, label: statusLabels[value], user: undefined })) },
  ]
  function toggle(key: FilterKey, value: string) {
    const current: readonly string[] = filters[key] ?? []
    setTaskFilters(projectId, { [key]: current.includes(value) ? current.filter(item => item !== value) : [...current, value] } as Partial<TaskFilters>)
  }
  const chips = groups.flatMap(group => group.options.filter(option => (filters[group.key] as string[] | undefined)?.includes(option.value)).map(option => ({ key: `${group.key}:${option.value}`, label: option.label, category: group.label, remove: () => toggle(group.key, option.value) })))
  if (filters.search) chips.unshift({ key: 'search', label: `“${filters.search}”`, category: 'Search', remove: () => setTaskFilters(projectId, { search: '' }) })
  return <div className="flex flex-col gap-3 border-b bg-surface px-4 py-3 sm:px-7" aria-label="Task filters">
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-40 flex-1 md:max-w-60"><Search aria-hidden="true" className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" /><Input aria-label="Search task titles" placeholder="Search tasks…" value={filters.search ?? ''} onChange={event => setTaskFilters(projectId, { search: event.target.value })} className="pl-8" /></div>
      <div className="hidden items-center gap-2 md:flex">{groups.map(group => <DropdownMenu key={group.key}>
        <DropdownMenuTrigger render={<Button variant="secondary" />}>
          {group.label}{!!filters[group.key]?.length && <Badge variant="secondary">{filters[group.key]!.length}</Badge>}<ChevronDown data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56"><DropdownMenuGroup><DropdownMenuLabel>Filter by {group.label.toLowerCase()}</DropdownMenuLabel>{group.options.map(option => <DropdownMenuCheckboxItem key={option.value} checked={(filters[group.key] as string[] | undefined)?.includes(option.value) ?? false} closeOnClick={false} onCheckedChange={() => toggle(group.key, option.value)}>{option.user && <UserAvatar user={option.user} size="sm" />}{option.label}</DropdownMenuCheckboxItem>)}</DropdownMenuGroup></DropdownMenuContent>
      </DropdownMenu>)}</div>
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogTrigger render={<Button variant="secondary" className="md:hidden" />}><SlidersHorizontal data-icon="inline-start" />Filters{chips.length > 0 && <Badge variant="secondary">{chips.length}</Badge>}</DialogTrigger>
        <DialogContent className="task-filter-sheet"><DialogHeader><DialogTitle>Filter tasks</DialogTitle><DialogDescription>Combine filters to narrow down your project. Changes apply to Board and List.</DialogDescription></DialogHeader>
          <FieldGroup>{groups.map(group => <FieldSet key={group.key}><FieldLegend>{group.label}</FieldLegend><FieldGroup>{group.options.map(option => <Field key={option.value} orientation="horizontal"><Checkbox id={`mobile-${group.key}-${option.value}`} checked={(filters[group.key] as string[] | undefined)?.includes(option.value) ?? false} onCheckedChange={() => toggle(group.key, option.value)} /><FieldLabel htmlFor={`mobile-${group.key}-${option.value}`}>{option.label}</FieldLabel></Field>)}</FieldGroup></FieldSet>)}</FieldGroup>
          <DialogFooter><Button variant="secondary" onClick={() => clearTaskFilters(projectId)}>Clear filters</Button><Button onClick={() => setMobileOpen(false)}>Show results</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="ml-auto flex items-center gap-2">
        <nav aria-label="Task display" className="flex items-center gap-0.5 rounded-md border bg-canvas p-0.5">{([{ value: 'board', label: 'Board view', Icon: LayoutGrid }, { value: 'list', label: 'List view', Icon: List }] as const).map(({ value, label, Icon }) => <Link key={value} href={`/projects/${projectId}/${value}`} aria-label={label} title={label} aria-current={view === value ? 'page' : undefined} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative size-7', view === value && 'text-primary')}>
          {view === value && <motion.span layoutId={`task-view-${projectId}`} className="absolute inset-0 rounded bg-surface shadow-sm" transition={{ duration: reduced ? 0 : 0.18 }} />}<Icon className="relative size-4" />
        </Link>)}</nav>
        <Button onClick={onAdd}><Plus data-icon="inline-start" />Add task</Button>
      </div>
    </div>
    <AnimatePresence initial={false}>{chips.length > 0 && <motion.div key="active-filters" initial={{ opacity: 0, height: reduced ? 'auto' : 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: reduced ? 'auto' : 0 }} transition={{ duration: reduced ? 0 : 0.15 }} className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map(chip => <motion.div key={chip.key} layout={!reduced} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Badge variant="secondary" className="h-auto max-w-64 gap-1 py-0 md:h-6 md:py-0.5"><span className="truncate">{chip.category}: {chip.label}</span><button type="button" aria-label={`Remove ${chip.category.toLowerCase()} filter ${chip.label}`} onClick={chip.remove} className="flex size-10 shrink-0 items-center justify-center rounded outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:size-auto md:p-0.5"><X className="size-3" /></button></Badge></motion.div>)}
      <Button variant="ghost" size="sm" onClick={() => clearTaskFilters(projectId)}>Clear filters</Button>
    </motion.div>}</AnimatePresence>
  </div>
}
