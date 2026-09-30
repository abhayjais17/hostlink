'use client'

import { Database, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatarStack } from '@/components/ui/hostlink'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjects, useTasks, useUsers } from '@/lib/hooks'
import { isOverdue } from '@/lib/utils'

export function FoundationData() {
  const users = useUsers()
  const projects = useProjects()
  const tasks = useTasks()
  const loading = !users.data || !projects.data || !tasks.data
  const error = users.error || projects.error || tasks.error
  return <Card>
    <CardHeader><CardTitle><span className="inline-flex items-center gap-2"><Database className="size-4 text-brand-600" />The workspace underneath</span></CardTitle><CardDescription>Relative dates, real transition rules, and one source of truth.</CardDescription><CardAction><Badge variant="outline">In-memory demo</Badge></CardAction></CardHeader>
    <CardContent>
      {error ? <div role="alert" className="flex flex-wrap items-center gap-3"><p className="text-danger">Could not load the mock workspace.</p><Button variant="outline" onClick={() => { void users.mutate(); void projects.mutate(); void tasks.mutate() }}><RefreshCw data-icon="inline-start" />Retry</Button></div> : loading ? <div role="status" aria-label="Loading mock workspace" className="flex items-center gap-4"><Skeleton className="h-8 w-28" /><Skeleton className="h-8 flex-1" /></div> : <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-3"><UserAvatarStack users={users.data!} /><div className="flex flex-col"><span className="text-sm font-medium text-strong">Asha, Rohan & Meera</span><span className="text-sm text-muted-foreground">Your three-person demo team</span></div></div>
        <div className="flex flex-wrap items-center gap-6 tabular-nums"><div className="flex flex-col"><span className="font-semibold text-strong">{projects.data!.length} projects</span><span className="text-sm text-muted-foreground">Ready to explore</span></div><div className="flex flex-col"><span className="font-semibold text-strong">{tasks.data!.length} tasks</span><span className="text-sm text-muted-foreground">Across four statuses</span></div><div className="flex flex-col"><span className="font-semibold text-danger">{tasks.data!.filter(task => isOverdue(task)).length} overdue</span><span className="text-sm text-muted-foreground">Calculated, not stored</span></div></div>
      </div>}
    </CardContent>
  </Card>
}
