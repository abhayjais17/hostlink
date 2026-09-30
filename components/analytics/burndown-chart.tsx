'use client'

import { useReducedMotion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { BurndownPoint } from '@/lib/types'

const config = {
  total: { label: 'Total tasks', color: 'var(--chart-5)' },
  done: { label: 'Done tasks', color: 'var(--chart-4)' },
  remaining: { label: 'Remaining', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function BurndownChart({ data, compact = false }: { data: BurndownPoint[]; compact?: boolean }) {
  const reduced = useReducedMotion()
  return <Card size="sm" className="h-full min-w-0">
    <CardHeader><CardTitle>Burndown</CardTitle><CardDescription>Scope and progress over the last 10 days.</CardDescription></CardHeader>
    <CardContent className="min-w-0 flex-1">
      <ChartContainer config={config} className={compact ? 'h-52 w-full aspect-auto' : 'h-60 w-full aspect-auto'} aria-label="Task burndown over the last ten days">
        <LineChart accessibilityLayer data={data} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={22} tickMargin={10} tickFormatter={value => format(parseISO(value), 'MMM d')} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} domain={[0, 'auto']} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={label => typeof label === 'string' ? format(parseISO(label), 'MMM d, yyyy') : label} />} />
          <ChartLegend content={<ChartLegendContent className="flex-wrap gap-x-3 gap-y-1" />} />
          <Line dataKey="total" type="linear" stroke="var(--color-total)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={!reduced} animationDuration={600} />
          <Line dataKey="done" type="linear" stroke="var(--color-done)" strokeWidth={2} dot={false} isAnimationActive={!reduced} animationDuration={600} />
          <Line dataKey="remaining" type="linear" stroke="var(--color-remaining)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={!reduced} animationDuration={600} />
        </LineChart>
      </ChartContainer>
    </CardContent>
    <CardFooter className="items-start"><details className="w-full text-xs text-muted-foreground"><summary className="cursor-pointer rounded outline-none focus-visible:ring-2 focus-visible:ring-ring">View daily counts</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left tabular-nums"><caption className="sr-only">Burndown daily counts</caption><thead><tr>{['Date', 'Total', 'Done', 'Remaining'].map(label => <th key={label} scope="col" className="pb-2 pr-2 font-medium">{label}</th>)}</tr></thead><tbody>{data.map(point => <tr key={point.date}><th scope="row" className="py-1 pr-2 font-normal">{format(parseISO(point.date), 'MMM d')}</th><td>{point.total}</td><td>{point.done}</td><td>{point.remaining}</td></tr>)}</tbody></table></div></details></CardFooter>
  </Card>
}
