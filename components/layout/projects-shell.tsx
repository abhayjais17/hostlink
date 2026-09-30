'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FolderPlus, LayoutGrid, List, Plus, Search } from 'lucide-react'
import { Breadcrumbs } from './breadcrumbs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { NewProjectModal } from '@/components/projects/new-project-modal'
import { ProjectCard, ProjectsTable } from '@/components/projects/project-list'
import { ProjectsEmpty, ProjectsError, ProjectsLoading } from '@/components/projects/projects-feedback'
import { useCurrentUser, useProjectSummaries } from '@/lib/hooks'

export function ProjectsShell() {
  const { data: summaries, error, mutate } = useProjectSummaries()
  const { data: user } = useCurrentUser()
  const [view, setView] = useState('cards')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const reduced = useReducedMotion()
  const query = search.trim().toLowerCase()
  const visible = summaries?.filter(({ project }) => `${project.name} ${project.description}`.toLowerCase().includes(query)) ?? []
  const openCreate = () => setCreateOpen(true)

  return <motion.div initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.15, ease: [0.2, 0.8, 0.2, 1] }} className="flex flex-1 flex-col">
    <header className="border-b bg-surface px-4 py-5 sm:px-7">
      <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Projects' }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2.5"><h1 className="text-xl font-semibold tracking-tight">Projects</h1>{summaries && <Badge variant="secondary">{summaries.length}</Badge>}</div><Button onClick={openCreate}><Plus data-icon="inline-start" />New Project</Button></div>
      <p className="mt-2 text-xs text-muted-foreground">A shared space for everything your team is working on.</p>
    </header>
    <section aria-label="Your projects" className="flex flex-1 flex-col gap-5 px-4 py-5 sm:px-7 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-sm font-semibold">All projects</h2><p role="status" className="text-xs text-muted-foreground">{summaries ? `${visible.length} ${visible.length === 1 ? 'project' : 'projects'}${query ? ` matching your search` : ' in your workspace'}` : 'Loading your workspace…'}</p></div>
        <div className="flex w-full items-center gap-3 sm:w-auto"><div role="search" className="flex min-w-0 flex-1 items-center gap-2 sm:w-60"><Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /><Input aria-label="Search projects" placeholder="Search projects…" value={search} maxLength={200} onChange={event => setSearch(event.target.value)} /></div>
          <ToggleGroup aria-label="Project view" variant="outline" spacing={0} value={[view]} onValueChange={values => { if (values.length) setView(String(values[0])) }}><ToggleGroupItem value="cards" aria-label="Card view"><LayoutGrid /></ToggleGroupItem><ToggleGroupItem value="table" aria-label="Table view"><List /></ToggleGroupItem></ToggleGroup>
        </div>
      </div>
      {error ? <ProjectsError onRetry={() => void mutate()} /> : !summaries ? <ProjectsLoading table={view === 'table'} /> : visible.length === 0 ? <ProjectsEmpty filtered={summaries.length > 0} onAction={summaries.length ? () => setSearch('') : openCreate} /> : view === 'table' ? <ProjectsTable summaries={visible} /> : <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map(summary => <ProjectCard key={summary.project.id} summary={summary} />)}
        {!query && <button type="button" onClick={openCreate} className="group flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-surface/40 p-6 text-center outline-none transition-[background-color,border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:transform-none"><span className="flex size-11 items-center justify-center rounded-lg border bg-surface text-primary shadow-sm"><FolderPlus className="size-5" /></span><span className="text-sm font-medium text-strong">Start something new</span><span className="max-w-48 text-xs text-muted-foreground">Create a project and give your next idea a place to grow.</span><span className="mt-1 text-xs font-medium text-primary">Create project</span></button>}
      </div>}
      <p className="mt-auto pt-8 text-xs text-muted-foreground">Demo workspace · Changes stay in this tab and reset on reload.</p>
    </section>
    {createOpen && <NewProjectModal defaultMemberId={user?.id} onClose={() => setCreateOpen(false)} onCreated={() => setSearch('')} />}
  </motion.div>
}
