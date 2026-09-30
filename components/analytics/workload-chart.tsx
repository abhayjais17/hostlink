'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { UserAvatar } from '@/components/ui/hostlink'
import type { User, WorkloadPoint } from '@/lib/types'

const config = {
  backlog: { label: 'Backlog', color: 'var(--chart-5)' },
  in_progress: { label: 'In Progress', color: 'var(--chart-2)' },
  review: { label: 'Review', color: 'var(--chart-3)' },
} satisfies ChartConfig

export function WorkloadChart({ data, users, compact = false, mini = false }: { data: WorkloadPoint[]; users: User[]; compact?: boolean; mini?: boolean }) {
  const reduced = useReducedMotion()
  const total = data.reduce((sum, point) => sum + point.total, 0)
  if (mini) return <div className="flex flex-col gap-3" aria-label={`${data[0]?.name ?? 'Team'} workload: ${total} open tasks`}>
    <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">{(['backlog', 'in_progress', 'review'] as const).map(status => {
      const count = data.reduce((sum, point) => sum + point[status], 0)
      return <motion.div key={status} initial={{ width: reduced ? `${count / Math.max(total, 1) * 100}%` : 0 }} animate={{ width: `${count / Math.max(total, 1) * 100}%` }} transition={{ duration: reduced ? 0 : 0.6 }} style={{ background: config[status].color }} />
    })}</div>
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">{(['backlog', 'in_progress', 'review'] as const).map(status => <div key={status} className="flex items-center gap-1.5"><span className="size-1.5 rounded-full" style={{ background: config[status].color }} aria-hidden="true" /><dt>{config[status].label}</dt><dd className="font-medium tabular-nums text-body">{data.reduce((sum, point) => sum + point[status], 0)}</dd></div>)}</dl>
    {!total && <p className="text-xs text-muted-foreground">No open tasks assigned.</p>}
  </div>
  return <Card size="sm" className="h-full min-w-0">
    <CardHeader><CardTitle>Team workload</CardTitle><CardDescription>Open tasks by assignee and status.</CardDescription></CardHeader>
    <CardContent className="min-w-0 flex-1">
      <ChartContainer config={config} className="w-full aspect-auto" style={{ height: Math.max(compact ? 208 : 240, data.length * 56 + 65) }} aria-label={`Team workload: ${total} open tasks`}>
        <BarChart accessibilityLayer data={data} layout="vertical" margin={{ top: 4, left: 0, right: 16, bottom: 0 }} barSize={20}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} domain={[0, Math.max(1, ...data.map(point => point.total))]} />
          <YAxis dataKey="userId" type="category" width={126} axisLine={false} tickLine={false} interval={0} tick={({ x, y, payload }) => {
            const user = users.find(user => user.id === payload.value)
            const name = user?.name ?? data.find(point => point.userId === payload.value)?.name ?? 'Team member'
            return <g transform={`translate(${x},${y})`}><foreignObject x={-114} y={-18} width={110} height={36}><div className="flex h-full items-center gap-2 text-[11px] text-body">{user && <UserAvatar user={user} size="sm" />}<span className="line-clamp-2 leading-4" title={name}>{name}</span></div></foreignObject></g>
          }} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload[0]?.payload?.name ?? 'Team member'} />} />
          <ChartLegend content={<ChartLegendContent className="flex-wrap gap-x-3 gap-y-1" />} />
          {(['backlog', 'in_progress', 'review'] as const).map(status => <Bar key={status} dataKey={status} stackId="open" fill={`var(--color-${status})`} isAnimationActive={!reduced} animationDuration={600} />)}
        </BarChart>
      </ChartContainer>
    </CardContent>
    <CardFooter className="items-start"><details className="w-full text-xs text-muted-foreground"><summary className="cursor-pointer rounded outline-none focus-visible:ring-2 focus-visible:ring-ring">{total} open {total === 1 ? 'task' : 'tasks'} · View workload counts</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left tabular-nums"><caption className="sr-only">Open tasks per team member</caption><thead><tr>{['Assignee', 'Backlog', 'In Progress', 'Review', 'Total'].map(label => <th scope="col" key={label} className="pb-2 pr-2 font-medium">{label}</th>)}</tr></thead><tbody>{data.map(point => <tr key={point.userId}><th scope="row" className="py-1 pr-2 font-normal">{point.name}</th><td>{point.backlog}</td><td>{point.in_progress}</td><td>{point.review}</td><td>{point.total}</td></tr>)}</tbody></table></div></details></CardFooter>
  </Card>
}
