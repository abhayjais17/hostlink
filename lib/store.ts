import { createStore } from 'zustand/vanilla'
import type { DomainData, TaskFilters } from './types'

interface DomainState extends DomainData { revision: number; nextTaskNumber: number; currentUserId: string }

// Initialize with empty data - real data comes from API
export const domainStore = createStore<DomainState>(() => ({
  users: [],
  projects: [],
  tasks: [],
  comments: [],
  events: [],
  revision: 0,
  nextTaskNumber: 12,
  currentUserId: 'u1',
}))

interface UIState {
  sidebarExpanded: boolean
  activeProjectId: string
  starredProjectIds: string[]
  filtersByProject: Record<string, TaskFilters>
  setSidebarExpanded: (expanded: boolean) => void
  setActiveProject: (id: string) => void
  setFilters: (projectId: string, filters: TaskFilters) => void
  clearFilters: (projectId: string) => void
}
export const uiStore = createStore<UIState>(set => ({
  sidebarExpanded: true, activeProjectId: 'website-revamp', starredProjectIds: [], filtersByProject: {},
  setSidebarExpanded: sidebarExpanded => set({ sidebarExpanded }),
  setActiveProject: activeProjectId => set({ activeProjectId }),
  setFilters: (projectId, filters) => set(state => ({ filtersByProject: { ...state.filtersByProject, [projectId]: filters } })),
  clearFilters: projectId => set(state => ({ filtersByProject: { ...state.filtersByProject, [projectId]: {} } })),
}))
