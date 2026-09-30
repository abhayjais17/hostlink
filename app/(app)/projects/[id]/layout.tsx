import { ProjectHeader } from '@/components/layout/project-header'

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProjectHeader projectId={id}>{children}</ProjectHeader>
}
