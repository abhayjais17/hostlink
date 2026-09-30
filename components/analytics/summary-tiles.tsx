'use client'

import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { AlertCircle, CircleCheck, CircleDot, ListTodo } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Analytics } from '@/lib/types'

export function AnimatedNumber({ value }: { value: number }) {
  const reduced = useReducedMotion()
  const counter = useMotionValue(0)
  const rounded = useTransform(counter, latest => Math.round(latest).toString())
  useEffect(() => {
    const controls = animate(counter, value, { duration: reduced ? 0 : 0.6, ease: [0.2, 0.8, 0.2, 1] })
    return () => controls.stop()
  }, [counter, value, reduced])
  return <span><span className="sr-only">{value}</span><motion.span aria-hidden="true">{rounded}</motion.span></span>
}

export function SummaryTiles({ analytics, workspace = false }: { analytics: Analytics; workspace?: boolean }) {
  const tiles = [
    { label: 'Total tasks', value: analytics.total, icon: ListTodo, color: 'text-primary', note: workspace ? 'Across all projects' : 'Across this project' },
    { label: 'In Progress', value: analytics.counts.in_progress, icon: CircleDot, color: 'text-status-progress', note: 'Work in motion' },
    { label: 'Done', value: analytics.counts.done, icon: CircleCheck, color: 'text-success', note: 'Completed tasks' },
    { label: 'Overdue', value: analytics.overdueCount, icon: AlertCircle, color: 'text-danger', note: 'Open past due date' },
  ]
  return <section aria-label={workspace ? 'Workspace summary' : 'Project summary'} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {tiles.map(({ label, value, icon: Icon, color, note }) => <Card key={label} size="sm" aria-label={`${label}: ${value}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2"><CardTitle>{label}</CardTitle><Icon aria-hidden="true" className={cn('size-4 shrink-0', color)} /></CardHeader>
      <CardContent><p className={cn('text-3xl font-semibold leading-9 tracking-tight tabular-nums', color)}><AnimatedNumber value={value} /></p><p className="mt-1 text-[11px] text-muted-foreground">{note}</p></CardContent>
    </Card>)}
  </section>
}
