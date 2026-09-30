'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/hostlink'
import { STATUSES, type Analytics } from '@/lib/types'
import { statusLabels } from '@/lib/utils'
import { AnimatedNumber } from './summary-tiles'

export function CompletionRing({ analytics }: { analytics: Analytics }) {
  const reduced = useReducedMotion()
  return <Card size="sm" className="h-full min-w-0">
    <CardHeader><CardTitle>Completion</CardTitle><CardDescription>Every task moves the project forward.</CardDescription></CardHeader>
    <CardContent className="flex flex-1 flex-wrap items-center justify-center gap-6 py-3">
      <div className="relative size-40 shrink-0" role="img" aria-label={`${analytics.completionPct}% complete, ${analytics.counts.done} of ${analytics.total} tasks done`}>
        <svg viewBox="0 0 160 160" className="size-full -rotate-90" aria-hidden="true"><circle cx="80" cy="80" r="68" fill="none" stroke="var(--border)" strokeWidth="10" /><motion.circle cx="80" cy="80" r="68" fill="none" stroke="var(--brand-600)" strokeWidth="10" strokeLinecap={analytics.completionPct ? 'round' : 'butt'} pathLength="100" strokeDasharray="100" initial={{ strokeDashoffset: reduced ? 100 - analytics.completionPct : 100 }} animate={{ strokeDashoffset: 100 - analytics.completionPct }} transition={{ duration: reduced ? 0 : 0.6, ease: [0.2, 0.8, 0.2, 1] }} /></svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true"><span className="text-3xl font-semibold tracking-tight text-strong tabular-nums"><AnimatedNumber value={analytics.completionPct} /><span className="text-xl">%</span></span><span className="text-xs text-muted-foreground">complete</span></div>
      </div>
      <dl className="flex min-w-32 flex-col gap-3">{STATUSES.map(status => <div key={status} className="flex items-center gap-2 text-xs"><StatusDot status={status} /><dt>{statusLabels[status]}</dt><dd className="ml-auto pl-5 font-semibold text-strong tabular-nums">{analytics.counts[status]}</dd></div>)}</dl>
    </CardContent>
    <CardFooter><p className="text-xs text-muted-foreground"><span className="font-medium text-strong">{analytics.counts.done} of {analytics.total} tasks</span> completed{analytics.total ? ` · ${analytics.total - analytics.counts.done} remaining` : ''}</p></CardFooter>
  </Card>
}
