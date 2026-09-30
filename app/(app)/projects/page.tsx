import type { Metadata } from 'next'
import { ProjectsShell } from '@/components/layout/projects-shell'

export const metadata: Metadata = { title: 'Projects', description: 'Browse team projects, track completion and overdue work, and create a shared space for your next project in Hostlink.' }

export default function ProjectsPage() {
  return <ProjectsShell />
}
