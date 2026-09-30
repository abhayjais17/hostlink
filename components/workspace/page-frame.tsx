'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

export function PageFrame({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  return <motion.div initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.15 }} className="flex min-w-0 flex-col gap-5 p-4 sm:p-7">{children}</motion.div>
}

export function PageLoading({ label }: { label: string }) {
  return <div aria-label={`Loading ${label}`} aria-busy="true" className="flex flex-col gap-5 p-4 sm:p-7"><Skeleton className="h-8 w-48" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-52" />)}</div><Skeleton className="h-56 w-full" /></div>
}

export function PageError({ retry }: { retry: () => void }) {
  return <div role="alert" className="p-4 sm:p-7"><Empty className="border bg-surface"><EmptyHeader><EmptyTitle>Could not load this page</EmptyTitle><EmptyDescription>Your workspace is unchanged. Please try again.</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={retry}>Try again</Button></EmptyContent></Empty></div>
}
