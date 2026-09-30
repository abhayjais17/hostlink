'use client'

import { useEffect, useState } from 'react'
import { TaskWorkspace } from '@/components/task/task-workspace'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useUIStore } from '@/lib/hooks'

export function AppShell({ children }: { children: React.ReactNode }) {
  const expanded = useUIStore(state => state.sidebarExpanded)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = () => { if (media.matches) setMobileOpen(false) }
    media.addEventListener('change', closeOnDesktop)
    return () => media.removeEventListener('change', closeOnDesktop)
  }, [])
  return <TaskWorkspace><div className="flex h-dvh overflow-hidden bg-canvas [overflow-wrap:anywhere]">
    <a href="#main-content" className="sr-only rounded bg-surface p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50">Skip to content</a>
    <aside className="app-rail hidden shrink-0 md:block" data-expanded={expanded}><Sidebar /></aside>
    <div className="flex min-w-0 flex-1 flex-col"><Topbar onOpenNavigation={() => setMobileOpen(true)} /><main id="main-content" tabIndex={-1} className="flex min-h-0 flex-1 flex-col overflow-y-auto outline-none">{children}</main></div>
    <Dialog open={mobileOpen} onOpenChange={setMobileOpen}><DialogContent className="mobile-navigation" style={{ translate: 'none' }} showCloseButton={false}><DialogTitle className="sr-only">Workspace navigation</DialogTitle><Sidebar mobile onNavigate={() => setMobileOpen(false)} /></DialogContent></Dialog>
  </div></TaskWorkspace>
}
