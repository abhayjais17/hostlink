'use client'

import Link from 'next/link'
import { useDeferredValue } from 'react'
import { ArrowUpRight, FolderClosed, Search } from 'lucide-react'
import { Modal } from '@/components/ui/hostlink'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { useWorkspaceSearch } from '@/lib/hooks'

export function SearchDialog({ open, onOpenChange, query, onQueryChange }: { open: boolean; onOpenChange: (open: boolean) => void; query: string; onQueryChange: (query: string) => void }) {
  const deferredQuery = useDeferredValue(query)
  const { data, error, isValidating } = useWorkspaceSearch(deferredQuery)
  const updating = isValidating || query !== deferredQuery
  return <Modal open={open} onOpenChange={onOpenChange} title="Search your workspace" description="Find a project or task across your demo workspace.">
    <Field><FieldLabel className="sr-only" htmlFor="workspace-search">Search projects and tasks</FieldLabel><Input id="workspace-search" autoFocus placeholder="Try Website Revamp or HL-7…" value={query} maxLength={200} onChange={event => onQueryChange(event.target.value)} /></Field>
    <div className="max-h-80 overflow-y-auto" aria-live="polite" aria-busy={updating}>
      {error ? <p role="alert" className="py-6 text-center text-danger">Search is unavailable. Please try again.</p> : !data || updating ? <div className="flex flex-col gap-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : <>
        {data.projects.length > 0 && <p className="mb-2 text-xs text-muted-foreground">Projects</p>}
        {data.projects.map(project => <Link key={project.id} href={`/projects/${project.id}`} onClick={() => onOpenChange(false)} className="flex items-center gap-3 rounded-md p-3 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"><FolderClosed className="size-4 text-primary" /><span className="flex-1 text-sm">{project.name}</span><ArrowUpRight className="size-3 text-muted-foreground" /></Link>)}
        {data.tasks.length > 0 && <p className="mt-4 mb-2 text-xs text-muted-foreground">Tasks</p>}
        {data.tasks.map(task => <Link key={task.id} href={`/projects/${task.projectId}/board?task=${task.id}`} onClick={() => onOpenChange(false)} className="flex items-start gap-3 rounded-md p-3 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"><span className="shrink-0 text-xs text-muted-foreground">{task.key}</span><span className="text-sm">{task.title}</span></Link>)}
        {!data.projects.length && !data.tasks.length && <div className="flex flex-col items-center gap-2 py-8"><Search className="size-6 text-muted-foreground" /><p className="text-sm">No results for &ldquo;{query}&rdquo;</p><p className="text-xs text-muted-foreground">Try another project name, task title, or task key.</p></div>}
      </>}
    </div>
  </Modal>
}
