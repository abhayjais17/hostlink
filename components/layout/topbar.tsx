'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTaskWorkspace } from '@/components/task/task-workspace'
import { NewProjectModal } from '@/components/projects/new-project-modal'
import { useCurrentUser } from '@/lib/hooks'
import { useEffect, useRef, useState } from 'react'
import { CircleHelp, Menu, Plus, Search } from 'lucide-react'
import { Brand } from './brand'
import { UserMenu } from './user-menu'
import { Notifications } from './notifications'
import { SearchDialog } from './search-dialog'
import { IconButton, Modal, SplitButton } from '@/components/ui/hostlink'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export function Topbar({ onOpenNavigation }: { onOpenNavigation: () => void }) {
  const router = useRouter()
  const { data: user } = useCurrentUser()
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.isComposing || event.keyCode === 229 || event.repeat) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setSearchOpen(true)
      }
      const target = event.target as HTMLElement | null
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="textbox"]')) {
        event.preventDefault()
        if (window.matchMedia('(min-width: 768px)').matches) searchRef.current?.focus()
        else setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  const newProject = () => setCreateOpen(true)
  const { openCreate } = useTaskWorkspace()
  const params = useParams<{ id?: string }>()
  const newTask = () => openCreate(params.id)
  return <header className="flex h-14 shrink-0 items-center gap-1.5 border-b bg-surface px-3 md:h-12 md:gap-3 md:px-5">
    <IconButton label="Open navigation" onClick={onOpenNavigation} className="md:hidden"><Menu /></IconButton>
    <Link href="/projects" aria-label="Hostlink projects" className="shrink-0 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="hidden sm:inline-flex"><Brand /></span><span className="inline-flex sm:hidden"><Brand compact /></span></Link>
    <form role="search" className="ml-3 hidden min-w-0 w-52 max-w-sm items-center gap-2 transition-[width] duration-200 focus-within:w-80 md:flex" onSubmit={event => { event.preventDefault(); setSearchOpen(true) }}>
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><Input ref={searchRef} aria-label="Global search" placeholder="Search anything…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }} className="border-0 shadow-none" />
      <kbd className="hidden shrink-0 rounded border px-1.5 text-[10px] leading-5 text-muted-foreground lg:block">Ctrl K</kbd>
    </form>
    <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
      <IconButton label="Search workspace" className="md:hidden" onClick={() => setSearchOpen(true)}><Search /></IconButton>
      <SplitButton onClick={newProject} actions={[{ label: 'New Project', onClick: newProject }, { label: 'New Task', onClick: newTask }]}><Plus data-icon="inline-start" /><span className="sr-only md:not-sr-only">New</span></SplitButton>
      <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />
      <IconButton label="Help and shortcuts" onClick={() => setHelpOpen(true)} className="hidden md:inline-flex"><CircleHelp /></IconButton>
      <Notifications /><UserMenu />
    </div>
    {searchOpen && <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} query={query} onQueryChange={setQuery} />}
    {createOpen && <NewProjectModal defaultMemberId={user?.id} onClose={() => setCreateOpen(false)} onCreated={() => router.push('/projects')} />}
    <Modal open={helpOpen} onOpenChange={setHelpOpen} title="A little help getting around" description="Hostlink · Your workspace">
      <dl className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-3 text-sm"><dt>Search the workspace</dt><dd><kbd>Ctrl / ⌘ K</kbd></dd><dt>Focus global search</dt><dd><kbd>/</kbd></dd><dt>Create a task</dt><dd><kbd>C</kbd></dd><dt>Close a dialog or menu</dt><dd><kbd>Esc</kbd></dd></dl>
      <p className="text-xs text-muted-foreground">Switch demo users with the avatar in the top bar. All data is in memory and resets on reload. Create projects with the New button, press C to add a task, and use My Tasks or Analytics for a workspace-wide view.</p>
    </Modal>
  </header>
}
