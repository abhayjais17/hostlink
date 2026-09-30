'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ChartNoAxesCombined, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskWorkspace } from '@/components/task/task-workspace'
import { useAnalytics, useProjectEvents, useTasks, useUsers } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { SummaryTiles } from './summary-tiles'
import { CompletionRing } from './completion-ring'
import { BurndownChart } from './burndown-chart'
import { WorkloadChart } from './workload-chart'
import { OverdueTasks, ProjectActivity } from './project-activity'

export function ProjectInsights({ projectId, overview = false }: { projectId: string; overview?: boolean }) {
  const analytics = useAnalytics(projectId)
  const tasks = useTasks(projectId)
  const events = useProjectEvents(projectId)
  const users = useUsers()
  const { openCreate } = useTaskWorkspace()
  const reduced = useReducedMotion()
  const title = overview ? 'Project overview' : 'Project analytics'
  if (analytics.error || tasks.error || events.error || users.error) return <section aria-label={title} className="p-4 sm:p-7"><Empty><EmptyHeader><EmptyTitle>Could not load project insights</EmptyTitle><EmptyDescription>Your tasks are unchanged. Try loading the data again.</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={() => { void analytics.mutate(); void tasks.mutate(); void events.mutate(); void users.mutate() }}>Try again</Button></EmptyContent></Empty></section>
  if (!analytics.data || !tasks.data || !events.data || !users.data) return <section aria-label={`Loading ${title.toLowerCase()}`} aria-busy="true" className="flex flex-col gap-5 p-4 sm:p-7"><Skeleton className="h-8 w-52" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div><div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-72" />)}</div></section>
  const data = analytics.data
  return <motion.section aria-label={title} initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.15 }} className="flex flex-col gap-5 p-4 sm:p-7">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-semibold tracking-tight">{overview ? 'Overview' : 'Analytics'}</h2><Badge variant="outline"><span aria-hidden="true" className="size-1.5 rounded-full bg-success" />Live in this demo</Badge></div><p className="mt-1 text-xs text-muted-foreground">{overview ? 'The big picture, and what needs your attention.' : 'A clear picture of progress, pace, and team capacity.'} All project tasks; board filters do not apply.</p></div><Button onClick={() => openCreate(projectId)}><Plus />Add task</Button></header>
    <SummaryTiles analytics={data} />
    {!data.total && <Empty className="border bg-surface"><EmptyHeader><EmptyMedia variant="icon"><ChartNoAxesCombined /></EmptyMedia><EmptyTitle>Your project starts here</EmptyTitle><EmptyDescription>Add a task to start tracking completion, workload, and progress.</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={() => openCreate(projectId)}><Plus />Create your first task</Button></EmptyContent></Empty>}
    <div className={cn('grid min-w-0 gap-4', overview ? 'xl:grid-cols-3' : 'xl:grid-cols-2')}>
      <CompletionRing analytics={data} />
      <BurndownChart data={data.burndown} compact={overview} />
      <WorkloadChart data={data.workload} users={users.data} compact={overview} />
      {!overview && <OverdueTasks tasks={data.overdueTasks} users={users.data} />}
    </div>
    {overview && <div className="grid min-w-0 gap-4 xl:grid-cols-2"><OverdueTasks tasks={data.overdueTasks} users={users.data} /><ProjectActivity tasks={tasks.data} events={events.data} users={users.data} /></div>}
    <p className="text-[11px] text-muted-foreground">{overview ? 'Updates reflect task changes immediately.' : 'Daily history is reconstructed from task events in your local timezone. Deleted tasks are excluded.'} Demo data resets when you reload.</p>
  </motion.section>
}
