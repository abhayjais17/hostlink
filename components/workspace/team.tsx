'use client'

import { useState } from 'react'
import { Mail, Search, Users } from 'lucide-react'
import { WorkloadChart } from '@/components/analytics/workload-chart'
import { AnimatedNumber } from '@/components/analytics/summary-tiles'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/hostlink'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useWorkspaceAnalytics } from '@/lib/hooks'
import { PageError, PageFrame, PageLoading } from './page-frame'

export function TeamPage() {
  const result = useWorkspaceAnalytics()
  const [search, setSearch] = useState('')
  if (result.error) return <PageError retry={() => void result.mutate()} />
  if (!result.data) return <PageLoading label="team" />
  const { users, analytics, projects } = result.data
  const members = users.filter(user => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(search.trim().toLowerCase()))
  return <PageFrame>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-base font-semibold">People behind the progress</h2><p className="mt-1 text-xs text-muted-foreground">{users.length} members · {analytics.total - analytics.counts.done} open tasks across the workspace</p></div><div className="flex w-full max-w-xs items-center gap-2"><Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><Input aria-label="Search team" placeholder="Find a team member…" value={search} onChange={event => setSearch(event.target.value)} /></div></div>
    <div className="grid min-w-0 gap-4 lg:grid-cols-2 2xl:grid-cols-3">{members.map(user => {
      const workload = analytics.workload.filter(point => point.userId === user.id)
      const total = workload[0]?.total ?? 0
      const projectCount = projects.filter(summary => summary.project.memberIds.includes(user.id)).length
      return <article key={user.id} aria-label={user.name} className="min-w-0 rounded-lg transition-[transform,box-shadow] duration-150 ease-hostlink hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none"><Card className="h-full"><CardHeader><div className="mb-2 flex items-center justify-between gap-3"><UserAvatar user={user} size="lg" /><Badge variant="secondary">{user.role}</Badge></div><CardTitle>{user.name}</CardTitle><CardDescription><a className="inline-flex max-w-full items-center gap-1.5 rounded outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring" href={`mailto:${user.email}`}><Mail className="size-3.5 shrink-0" /><span className="truncate">{user.email}</span></a></CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="flex items-end justify-between gap-3"><div><p className="text-3xl font-semibold tabular-nums text-strong"><AnimatedNumber value={total} /></p><p className="text-xs text-muted-foreground">Open tasks</p></div><span className="text-xs text-muted-foreground">{projectCount} {projectCount === 1 ? 'project' : 'projects'}</span></div><WorkloadChart data={workload} users={[user]} mini /></CardContent><CardFooter><p className="text-xs text-muted-foreground">Across all projects · Completed tasks excluded</p></CardFooter></Card></article>
    })}</div>
    {!members.length && <Empty className="border bg-surface"><EmptyHeader><EmptyMedia variant="icon"><Users /></EmptyMedia><EmptyTitle>No team members found</EmptyTitle><EmptyDescription>Try another name, email address, or role.</EmptyDescription></EmptyHeader>{search && <Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button>}</Empty>}
  </PageFrame>
}
