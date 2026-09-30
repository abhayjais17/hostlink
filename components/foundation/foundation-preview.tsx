'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, Layers2, MoreHorizontal, Plus, SlidersHorizontal } from 'lucide-react'
import { Brand } from '@/components/layout/brand'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { IconButton, LoadingButton, Modal, OverdueBadge, PriorityBadge, SplitButton, StatusBadge } from '@/components/ui/hostlink'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { FoundationData } from './foundation-data'

const tokens = [
  { name: 'Brand', value: '#0F766E', color: 'bg-brand-600' },
  { name: 'Accent', value: '#F59E0B', color: 'bg-highlight' },
  { name: 'Canvas', value: '#F4F6F8', color: 'bg-canvas' },
  { name: 'Surface', value: '#FFFFFF', color: 'bg-surface' },
  { name: 'Rail', value: '#0B2B2A', color: 'bg-sidebar' },
]

export function FoundationPreview() {
  const [modalOpen, setModalOpen] = useState(false)
  const [pending, setPending] = useState(false)
  async function previewLoading() {
    setPending(true)
    await new Promise(resolve => setTimeout(resolve, 900))
    setPending(false)
    toast.success('Loading state complete', { description: 'The button keeps its width while saving.' })
  }
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-3"><Brand inverse /><span className="hidden border-l border-sidebar-foreground/20 pl-4 text-sm text-sidebar-foreground/70 sm:inline">Design foundation</span></div>
        <span className="text-sm text-sidebar-foreground/75">Design system preview</span>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <div className="flex flex-col gap-7">
        <motion.section initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4" aria-labelledby="foundation-heading">
          <div className="flex max-w-2xl flex-col gap-2"><div className="flex items-center gap-2 text-sm font-medium text-brand-600"><Layers2 className="size-4" />THE BUILDING BLOCKS</div><h1 id="foundation-heading" className="text-balance text-2xl font-semibold tracking-tight text-strong">A shared language for better work.</h1><p className="text-pretty text-sm text-muted-foreground">The Hostlink foundation: considered colors, compact controls, and a connected mock data layer. Explore the components below.</p></div>
          <Badge variant="subtle"><Check data-icon="inline-start" />Foundation preview</Badge>
        </motion.section>
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2" aria-label="Component library">
          <Card>
            <CardHeader><CardTitle>Actions & controls</CardTitle><CardDescription>Compact, clear, and consistent.</CardDescription><CardAction><IconButton label="About these controls" onClick={() => toast.info('Controls preview', { description: 'These are shared primitives, not project actions yet.' })}><MoreHorizontal /></IconButton></CardAction></CardHeader>
            <CardContent><div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2"><Button onClick={() => setModalOpen(true)}><Plus data-icon="inline-start" />Primary action</Button><Button variant="secondary" onClick={() => setModalOpen(true)}>Secondary</Button><Button variant="ghost" onClick={() => toast.info('Subtle action preview')}>Subtle</Button></div>
              <div className="flex flex-wrap items-center gap-2"><SplitButton onClick={() => setModalOpen(true)} actions={[{ label: 'Preview modal', onClick: () => setModalOpen(true) }, { label: 'Preview toast', onClick: () => toast.success('All set. Your feedback is visible here.') }]}><Plus data-icon="inline-start" />Split button</SplitButton><LoadingButton variant="outline" pending={pending} onClick={previewLoading}>Try loading</LoadingButton><Button disabled>Disabled</Button><IconButton label="Control options" onClick={() => toast.info('Icon button with a 150ms tooltip')}><SlidersHorizontal /></IconButton></div>
            </div></CardContent>
            <CardFooter><span className="text-sm text-muted-foreground">32px controls · 6px radius · Keyboard accessible</span></CardFooter>
          </Card>
          <Card>
            <CardHeader><CardTitle>Status & priority</CardTitle><CardDescription>A little context, at a glance.</CardDescription></CardHeader>
            <CardContent><div className="flex flex-col gap-5"><div className="flex flex-wrap items-center gap-2">{(['backlog', 'in_progress', 'review', 'done'] as const).map(status => <StatusBadge key={status} status={status} />)}</div><div className="flex flex-wrap items-center gap-2">{(['urgent', 'high', 'normal'] as const).map(priority => <PriorityBadge key={priority} priority={priority} />)}<OverdueBadge /></div></div></CardContent>
            <CardFooter><span className="text-sm text-muted-foreground">Color paired with labels and icons. Never color alone.</span></CardFooter>
          </Card>
          <Card>
            <CardHeader><CardTitle>The Hostlink palette</CardTitle><CardDescription>Deep teal. Light surfaces. Room to focus.</CardDescription></CardHeader>
            <CardContent><div className="flex flex-wrap gap-3">{tokens.map(token => <div key={token.name} className="flex min-w-20 flex-1 flex-col gap-2"><div className={`h-12 rounded-md border border-border ${token.color}`} /><div className="flex flex-col"><span className="text-sm font-medium text-strong">{token.name}</span><span className="text-sm text-muted-foreground">{token.value}</span></div></div>)}</div></CardContent>
            <CardFooter><span className="text-sm text-muted-foreground">Inter · Semantic tokens · Light mode by default</span></CardFooter>
          </Card>
          <Card>
            <CardHeader><CardTitle>Feedback & overlays</CardTitle><CardDescription>Every interaction has a clear response.</CardDescription></CardHeader>
            <CardContent><div className="flex flex-col gap-4"><div className="flex flex-wrap items-center gap-2"><Button variant="outline" onClick={() => setModalOpen(true)}>Open modal<ArrowRight data-icon="inline-end" /></Button><DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" />}>Show toast<ChevronDown data-icon="inline-end" /></DropdownMenuTrigger><DropdownMenuContent className="min-w-40"><DropdownMenuGroup><DropdownMenuItem onClick={() => toast.success('Success preview', { description: 'Your change has been acknowledged.' })}>Success</DropdownMenuItem><DropdownMenuItem onClick={() => toast.error('Error preview', { description: 'A clear explanation appears here.' })}>Error</DropdownMenuItem><DropdownMenuItem onClick={() => toast.info('Information preview', { description: 'A useful update, without interrupting your work.' })}>Information</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu></div><div className="flex items-center gap-3" aria-label="Skeleton loading example"><Skeleton className="size-9 rounded-full" /><div className="flex flex-1 flex-col gap-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/2" /></div><span className="text-sm text-muted-foreground">Loading state</span></div></div></CardContent>
            <CardFooter><span className="text-sm text-muted-foreground">Focus trapping · Esc to close · Reduced motion support</span></CardFooter>
          </Card>
        </section>
        <FoundationData />
        <Separator />
        <footer className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><p>Where teams host their work.</p><p>Next: app shell, navigation, and demo entry.</p></footer>
      </div>
    </main>
    <Modal open={modalOpen} onOpenChange={setModalOpen} title="A little space to focus" description="This is the shared Hostlink modal primitive." footer={<><Button size="lg" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button size="lg" onClick={() => { setModalOpen(false); toast.success('Modal confirmed', { description: 'Preview only. No project data was changed.' }) }}>Confirm preview</Button></>}>
      <p className="text-sm leading-6 text-body">Project and task forms will use this same surface. Focus stays inside the dialog, the background is dimmed, and Escape brings you back to your work.</p>
    </Modal>
  </div>
}
