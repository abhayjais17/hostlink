'use client'

import { FolderOpen, FolderPlus, SearchX, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'

export function ProjectsLoading({ table }: { table: boolean }) {
  return <div role="status" aria-label="Loading projects" aria-busy="true">
    <span className="sr-only">Loading projects</span>
    {table ? <div className="flex flex-col gap-4 rounded-lg border bg-surface p-4"><Skeleton className="h-8" />{[0, 1, 2].map(index => <Skeleton key={index} className="h-16" />)}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(index => <Card key={index}><CardHeader className="gap-3"><Skeleton className="size-10" /><Skeleton className="h-5 w-40" /><Skeleton className="h-10" /></CardHeader><CardContent className="flex flex-col gap-4"><Skeleton className="h-6" /><Skeleton className="h-5 w-28" /></CardContent><CardFooter className="justify-between"><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-28" /></CardFooter></Card>)}</div>}
  </div>
}

export function ProjectsEmpty({ filtered, onAction }: { filtered: boolean; onAction: () => void }) {
  return <Empty className="min-h-80 border bg-surface"><EmptyHeader><EmptyMedia><span className="flex size-16 items-center justify-center rounded-xl border bg-accent text-primary">{filtered ? <SearchX className="size-8" /> : <FolderOpen className="size-8" />}</span></EmptyMedia><EmptyTitle>{filtered ? 'No projects match your search' : 'A fresh start for great work'}</EmptyTitle><EmptyDescription>{filtered ? 'Try another name or description, or clear your search to see every project.' : 'Bring your people, tasks, and ideas together. Start by creating a project for your team.'}</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={onAction}>{!filtered && <FolderPlus data-icon="inline-start" />}{filtered ? 'Clear search' : 'Create your first project'}</Button></EmptyContent></Empty>
}

export function ProjectsError({ onRetry }: { onRetry: () => void }) {
  return <Empty role="alert" className="min-h-72 border bg-surface"><EmptyHeader><EmptyMedia variant="icon"><TriangleAlert /></EmptyMedia><EmptyTitle>Projects could not be loaded</EmptyTitle><EmptyDescription>Your workspace is still here. Please try loading it again.</EmptyDescription></EmptyHeader><EmptyContent><Button variant="secondary" onClick={onRetry}>Try again</Button></EmptyContent></Empty>
}
