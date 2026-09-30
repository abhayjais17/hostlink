'use client'

import Link from 'next/link'
import { ArrowUpRight, Plus } from 'lucide-react'
import { SummaryTiles } from '@/components/analytics/summary-tiles'
import { WorkloadChart } from '@/components/analytics/workload-chart'
import { BurndownChart } from '@/components/analytics/burndown-chart'
import { CompletionRing } from '@/components/analytics/completion-ring'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { ProjectIcon, ProjectProgress } from '@/components/projects/project-list'
import { useTaskWorkspace } from '@/components/task/task-workspace'
import { useWorkspaceAnalytics } from '@/lib/hooks'
import { PageError, PageFrame, PageLoading } from './page-frame'

export function WorkspaceAnalyticsPage() {
  const result = useWorkspaceAnalytics()
  const { openCreate } = useTaskWorkspace()
  if (result.error) return <PageError retry={() => void result.mutate()} />
  if (!result.data) return <PageLoading label="workspace analytics" />
  const { analytics, users, projects } = result.data
  return <PageFrame>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold">The bigger picture</h2><Badge variant="outline"><span aria-hidden="true" className="size-1.5 rounded-full bg-success" />Live in this demo</Badge></div><p className="mt-1 text-xs text-muted-foreground">{projects.length} projects · {users.length} team members · All tasks, regardless of board filters</p></div><Button onClick={() => openCreate()}><Plus />Add task</Button></div>
    <SummaryTiles analytics={analytics} workspace />
    {!analytics.total && <Empty className="border bg-surface"><EmptyHeader><EmptyTitle>A fresh start for your workspace</EmptyTitle><EmptyDescription>Add tasks to see progress and workload across your projects.</EmptyDescription></EmptyHeader></Empty>}
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <Card size="sm" className="min-w-0"><CardHeader><CardTitle>Project completion</CardTitle><CardDescription>Compare progress across every project.</CardDescription></CardHeader><CardContent className="flex flex-col gap-6">{projects.length ? projects.map(summary => <div key={summary.project.id} className="flex flex-col gap-3"><Link href={`/projects/${summary.project.id}/analytics`} className="group flex min-w-0 items-center gap-3 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"><ProjectIcon name={summary.project.name} color={summary.project.color} /><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-strong">{summary.project.name}</span><span className="text-xs text-muted-foreground">{summary.overdueCount ? `${summary.overdueCount} overdue` : summary.totalTasks ? 'No overdue tasks' : 'No tasks yet'}</span></span><ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground transition-colors group-hover:text-primary" /></Link><ProjectProgress summary={summary} /></div>) : <p className="text-xs text-muted-foreground">No projects yet. Create one from the New menu.</p>}</CardContent></Card>
      <WorkloadChart data={analytics.workload} users={users} />
      <CompletionRing analytics={analytics} />
      <BurndownChart data={analytics.burndown} />
    </div>
    <p className="text-[11px] text-muted-foreground">Totals and charts update with task changes. Daily history uses your local timezone. Demo data resets on reload.</p>
  </PageFrame>
}
