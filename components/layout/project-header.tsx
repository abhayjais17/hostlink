'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { Copy, Ellipsis, Pencil, Share2, Star, Trash2 } from 'lucide-react'
import { ProjectMembers } from '@/components/project/project-members'
import { toast } from 'sonner'
import { Breadcrumbs } from './breadcrumbs'
import { Button, buttonVariants } from '@/components/ui/button'
import { IconButton, Modal, UserAvatarStack } from '@/components/ui/hostlink'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useProject, useUIStore, useUsers } from '@/lib/hooks'
import { toggleProjectStar } from '@/lib/api'
import { cn, initials } from '@/lib/utils'
import { projectColors } from '@/components/projects/project-list'

const tabs = [ { label: 'Overview', path: '' }, { label: 'Board', path: '/board' }, { label: 'List', path: '/list' }, { label: 'Analytics', path: '/analytics' } ]

export function ProjectHeader({ projectId, children }: { projectId: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const { data: project, error } = useProject(projectId)
  const { data: users } = useUsers()
  const starred = useUIStore(state => state.starredProjectIds.includes(projectId))
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  if (error) return <section className="flex flex-col items-start gap-4 p-8"><h1 className="text-xl font-semibold">Project unavailable</h1><p className="text-muted-foreground">This project doesn&apos;t exist or could not be loaded.</p><Link href="/projects" className={buttonVariants({ variant: 'secondary' })}>Back to projects</Link></section>
  if (!project) return <div aria-label="Loading project" aria-busy="true" className="flex flex-col gap-5 border-b bg-surface p-6"><Skeleton className="h-4 w-48" /><Skeleton className="h-10 w-72 max-w-full" /><Skeleton className="h-8 w-80 max-w-full" /></div>
  const base = `/projects/${project.id}`
  async function copyLink() {
    try { await navigator.clipboard.writeText(shareUrl); toast.success('Project link copied') }
    catch { toast.error('Copy unavailable. Select and copy the link below.') }
  }
  return <>
    <section aria-label="Project header" className="shrink-0 border-b bg-surface px-4 pt-5 sm:px-7">
      <Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: project.name }]} />
      <div className="mt-5 mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 max-w-full items-center gap-3"><div aria-hidden="true" className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg text-base font-semibold text-primary-foreground', projectColors.find(option => option.value === project.color)?.className ?? 'bg-primary')}>{initials(project.name)}</div><div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-xl font-semibold tracking-tight">{project.name}</h1><IconButton label={starred ? 'Unstar project' : 'Star project'} aria-pressed={starred} onClick={() => toggleProjectStar(project.id)}><Star className={cn(starred && 'fill-highlight text-highlight')} /></IconButton></div><p className="mt-0.5 max-w-xl text-xs text-muted-foreground">{project.description}</p></div></div>
        <div className="ml-auto flex items-center gap-3">
          {users && <UserAvatarStack users={users.filter(user => project.memberIds.includes(user.id))} />}
          <span className="mx-1 hidden h-5 border-l sm:block" />
          <ProjectMembers projectId={projectId} members={project.members?.map((m: any) => ({
            id: m.user.id,
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.user.role,
            color: m.user.color
          })) || []} />
          <Button variant="secondary" onClick={() => { setShareUrl(`${window.location.origin}${base}`); setShareOpen(true) }}><Share2 data-icon="inline-start" />Share</Button>
          <DropdownMenu><DropdownMenuTrigger render={<IconButton label="Project actions"><Ellipsis /></IconButton>}><Ellipsis /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuGroup>
            <DropdownMenuItem onClick={() => toast.info('Project editing is unavailable in this demo.')}><Pencil />Edit project</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => toast.info('Project deletion is unavailable in this demo.', { description: 'No data has been deleted.' })}><Trash2 />Delete project</DropdownMenuItem>
          </DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
        </div>
      </div>
      <LayoutGroup id={`project-tabs-${project.id}`}><nav aria-label="Project views" className="flex gap-6 overflow-x-auto">{tabs.map(tab => {
        const href = base + tab.path
        const active = pathname === href
        return <Link key={tab.label} href={href} aria-current={active ? 'page' : undefined} className={cn('relative shrink-0 rounded-t px-1 pt-2 pb-3 text-[13px] outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', active ? 'font-medium text-primary' : 'text-muted-foreground')}>
          {tab.label}{active && <motion.span layoutId="project-underline" className="absolute inset-x-0 bottom-0 h-0.5 rounded-t bg-primary" transition={{ duration: reduced ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }} />}
        </Link>
      })}</nav></LayoutGroup>
    </section>
    {children}
    <Modal open={shareOpen} onOpenChange={setShareOpen} title={`Share ${project.name}`} description="Copy a link to this project shell. Sharing does not grant access or sync demo data." footer={<Button onClick={copyLink}><Copy data-icon="inline-start" />Copy link</Button>}>
      <Field><FieldLabel htmlFor="project-link">Project link</FieldLabel><Input id="project-link" readOnly value={shareUrl} onFocus={event => event.target.select()} /></Field>
      <p className="text-xs text-muted-foreground">Everyone opens their own in-memory demo. Invitations and permissions are not connected.</p>
    </Modal>
  </>
}
