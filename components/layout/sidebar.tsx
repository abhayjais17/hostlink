'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChartNoAxesCombined, CheckCheck, ChevronLeft, ChevronRight, FolderClosed, House, Settings2, Users, X } from 'lucide-react'
import { Brand } from './brand'
import { UserAvatar } from '@/components/ui/hostlink'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCurrentUser, useProjects, useUIStore } from '@/lib/hooks'
import { setSidebarExpanded } from '@/lib/api'
import { cn } from '@/lib/utils'
import { projectColors } from '@/components/projects/project-list'

const items = [
  { href: '/dashboard', label: 'Home', icon: House },
  { href: '/projects', label: 'Projects', icon: FolderClosed },
  { href: '/my-tasks', label: 'My Tasks', icon: CheckCheck },
  { href: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings2 },
]
const railControl = 'flex h-10 w-full items-center gap-3 rounded-md px-3 text-sidebar-foreground/75 outline-none transition-colors duration-150 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring active:scale-[0.98]'

export function Sidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const expanded = useUIStore(state => state.sidebarExpanded)
  const { data: user } = useCurrentUser()
  const { data: projects } = useProjects()
  return <div className="flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
    <div className="flex h-16 shrink-0 items-center gap-2 px-3"><Brand compact inverse /><span className="rail-label text-lg font-semibold tracking-tight">Workspace</span>{mobile && <button onClick={onNavigate} aria-label="Close navigation" title="Close navigation" className="ml-auto rounded p-1 focus-visible:ring-2 focus-visible:ring-sidebar-ring"><X className="size-4" /></button>}</div>
    <div className="rail-expanded mx-4 mb-5 flex-col border-b border-sidebar-border/70 pb-5"><span className="text-[13px] font-medium">Hostlink team</span><span className="text-xs text-sidebar-foreground/60">Demo workspace</span></div>
    <nav aria-label="Main navigation" className="flex flex-col gap-1 px-2">{items.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || pathname.startsWith(`${href}/`)
      return <Tooltip key={href}><TooltipTrigger render={<Link href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined} aria-label={label} className={cn(railControl, 'relative', active && 'bg-sidebar-accent text-sidebar-foreground')} />}>
        {active && <span className="absolute inset-y-2 -left-2 w-0.5 rounded-r bg-brand-500" />}<Icon className="size-4 shrink-0" aria-hidden="true" /><span className="rail-label whitespace-nowrap text-[13px]">{label}</span>
      </TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip>
    })}</nav>
    <div className="rail-expanded mt-8 flex-col gap-2 px-4"><p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/50">Your projects</p>{projects?.map(project => <Link key={project.id} href={`/projects/${project.id}`} onClick={onNavigate} className="flex items-center gap-2.5 rounded py-1 text-xs text-sidebar-foreground/75 outline-none hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"><span className={cn('size-1.5 shrink-0 rounded-sm', project.color === 'teal' ? 'bg-brand-500' : projectColors.find(option => option.value === project.color)?.className ?? 'bg-status-review')} />{project.name}</Link>)}</div>
    <div className="mt-auto flex flex-col gap-2 px-2 pb-4 pt-8">
      {!mobile && <Tooltip><TooltipTrigger render={<button className={cn(railControl, 'hidden xl:flex')} onClick={() => setSidebarExpanded(!expanded)} aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={expanded} />}>
        {expanded ? <ChevronLeft className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}<span className="rail-label text-xs">Collapse sidebar</span>
      </TooltipTrigger><TooltipContent side="right">{expanded ? 'Collapse sidebar' : 'Expand sidebar'}</TooltipContent></Tooltip>}
      {user && <div className="flex items-center gap-3 overflow-hidden border-t border-sidebar-border/70 px-1 pt-4"><UserAvatar user={user} /><div className="rail-expanded min-w-0 flex-col"><span className="truncate text-xs font-medium">{user.name}</span><span className="text-[11px] text-sidebar-foreground/60">{user.role}</span></div></div>}
    </div>
  </div>
}
