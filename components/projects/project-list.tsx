'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import { AlertCircle, ArrowUpRight, ListTodo } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatarStack } from '@/components/ui/hostlink'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn, initials } from '@/lib/utils'
import type { ProjectSummary } from '@/lib/types'

export const projectColors = [
  { value: 'teal', label: 'Teal', className: 'bg-primary' },
  { value: 'indigo', label: 'Indigo', className: 'bg-avatar-indigo' },
  { value: 'amber', label: 'Amber', className: 'bg-avatar-amber' },
  { value: 'blue', label: 'Blue', className: 'bg-info' },
  { value: 'violet', label: 'Violet', className: 'bg-status-review' },
]

export function ProjectIcon({ name, color }: { name: string; color: string }) {
  return <span aria-hidden="true" className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-primary-foreground', projectColors.find(option => option.value === color)?.className ?? 'bg-primary')}>{initials(name) || 'P'}</span>
}

export function ProjectProgress({ summary }: { summary: ProjectSummary }) {
  const reduced = useReducedMotion()
  return <div className="flex min-w-32 flex-col gap-2">
    <div className="flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">{summary.doneTasks} of {summary.totalTasks} completed</span><span className="font-medium tabular-nums text-strong">{summary.completionPct}%</span></div>
    <div role="progressbar" aria-label={`${summary.project.name} completion`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.completionPct} aria-valuetext={`${summary.doneTasks} of ${summary.totalTasks} tasks completed`} className="h-1.5 overflow-hidden rounded-full bg-muted">
      <motion.div initial={{ width: reduced ? `${summary.completionPct}%` : 0 }} animate={{ width: `${summary.completionPct}%` }} transition={{ duration: reduced ? 0 : 0.6, ease: [0.2, 0.8, 0.2, 1] }} className="h-full rounded-full bg-primary" />
    </div>
  </div>
}

function UpdatedTime({ value }: { value: string }) {
  return <time dateTime={value} title={format(new Date(value), 'PPpp')} className="text-xs text-muted-foreground">Updated {formatDistanceToNow(new Date(value), { addSuffix: true })}</time>
}

function OverdueCount({ count }: { count: number }) {
  return <Badge variant="overdue"><AlertCircle data-icon="inline-start" />{count} overdue</Badge>
}

export function ProjectCard({ summary }: { summary: ProjectSummary }) {
  const { project, members } = summary
  return <Link href={`/projects/${project.id}`} aria-label={`Open ${project.name}`} className="group block h-full rounded-lg outline-none transition-[transform,box-shadow] duration-150 ease-hostlink hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none">
    <Card className="h-full">
      <CardHeader><div className="mb-3 flex items-center justify-between"><ProjectIcon name={project.name} color={project.color} /><ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" /></div><CardTitle>{project.name}</CardTitle><CardDescription className="line-clamp-2 min-h-10">{project.description || 'A new space for your team’s next big idea.'}</CardDescription></CardHeader>
      <CardContent className="mt-auto flex flex-col gap-4"><ProjectProgress summary={summary} /><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary"><ListTodo data-icon="inline-start" />{summary.totalTasks} {summary.totalTasks === 1 ? 'task' : 'tasks'}</Badge>{summary.overdueCount > 0 && <OverdueCount count={summary.overdueCount} />}</div></CardContent>
      <CardFooter className="flex-wrap justify-between gap-3"><UserAvatarStack users={members} /><UpdatedTime value={summary.lastUpdated} /></CardFooter>
    </Card>
  </Link>
}

export function ProjectsTable({ summaries }: { summaries: ProjectSummary[] }) {
  return <>
    <div className="flex flex-col gap-4 md:hidden">{summaries.map(summary => <ProjectCard key={summary.project.id} summary={summary} />)}</div>
    <div className="hidden overflow-hidden rounded-lg border bg-surface shadow-sm md:block">
      <Table aria-label="Projects"><TableHeader><TableRow><TableHead className="pl-4">Project</TableHead><TableHead>Progress</TableHead><TableHead>Tasks</TableHead><TableHead>Overdue</TableHead><TableHead>Members</TableHead><TableHead className="pr-4">Last updated</TableHead></TableRow></TableHeader>
        <TableBody>{summaries.map(summary => <TableRow key={summary.project.id}>
          <TableCell className="max-w-80 py-4 pl-4"><Link href={`/projects/${summary.project.id}`} className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"><ProjectIcon name={summary.project.name} color={summary.project.color} /><span className="min-w-0"><span className="block truncate font-medium text-strong">{summary.project.name}</span><span className="block truncate text-xs text-muted-foreground">{summary.project.description || 'No description yet'}</span></span></Link></TableCell>
          <TableCell className="w-48 pr-6"><ProjectProgress summary={summary} /></TableCell><TableCell className="tabular-nums">{summary.totalTasks}</TableCell><TableCell>{summary.overdueCount > 0 ? <OverdueCount count={summary.overdueCount} /> : <span className="text-muted-foreground">None</span>}</TableCell><TableCell><UserAvatarStack users={summary.members} /></TableCell><TableCell className="pr-4"><UpdatedTime value={summary.lastUpdated} /></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
  </>
}
