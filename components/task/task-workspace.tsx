'use client'

import { createContext, Suspense, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { TaskDrawer } from './task-drawer'
import { TaskModal } from './task-modal'
import type { Status } from '@/lib/types'

type ModalRequest = { projectId?: string; taskId?: string; status?: Status }
type TaskActions = {
  openTask: (id: string) => void
  openCreate: (projectId?: string, status?: Status) => void
  openEdit: (id: string) => void
}
const TaskContext = createContext<TaskActions | null>(null)
export function useTaskWorkspace() {
  const context = useContext(TaskContext)
  if (!context) throw new Error('Task controls must be inside TaskWorkspace.')
  return context
}

function TaskDeepLink() {
  const params = useSearchParams()
  const id = params.get('task')
  const { openTask } = useTaskWorkspace()
  useEffect(() => { if (id) openTask(id) }, [id, openTask])
  return null
}

export function TaskWorkspace({ children }: { children: ReactNode }) {
  const params = useParams<{ id?: string }>()
  const [taskId, setTaskId] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalRequest | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerOpener = useRef<HTMLElement | null>(null)
  const modalOpener = useRef<HTMLElement | null>(null)
  const openTask = useCallback((id: string) => { drawerOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setTaskId(id); setDrawerOpen(true) }, [])
  const openCreate = useCallback((projectId?: string, status: Status = 'backlog') => { modalOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setModal({ projectId, status }) }, [])
  const openEdit = useCallback((id: string) => { modalOpener.current = document.querySelector<HTMLElement>('.task-detail-drawer [aria-label="Task actions"]') ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null); setModal({ taskId: id }) }, [])
  function closeDrawer() {
    setDrawerOpen(false)
    const url = new URL(window.location.href)
    if (url.searchParams.has('task')) { url.searchParams.delete('task'); window.history.replaceState(window.history.state, '', url) }
  }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
      if (event.key.toLowerCase() !== 'c' || (event.target as HTMLElement)?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="dialog"], [role="alertdialog"], [role="menu"]') || document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return
      event.preventDefault(); openCreate(params.id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [params.id, openCreate])
  return <TaskContext.Provider value={{ openTask, openCreate, openEdit }}>
    {children}
    <Suspense fallback={null}><TaskDeepLink /></Suspense>
    {taskId && <TaskDrawer key={taskId} taskId={taskId} open={drawerOpen} onClosed={() => setTaskId(null)} onClose={closeDrawer} onEdit={() => openEdit(taskId)} returnFocus={drawerOpener} />}
    {modal && <TaskModal request={modal} onClose={() => setModal(null)} returnFocus={modalOpener} />}
  </TaskContext.Provider>
}
