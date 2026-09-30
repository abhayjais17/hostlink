import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProjectInsights } from '@/components/analytics/project-insights'
import { Board } from '@/components/board/board'
import { TaskList } from '@/components/list/task-table'

const views = {
  overview: true,
  board: true,
  list: true,
  analytics: true,
}
type Props = { params: Promise<{ id: string; view?: string[] }> }
function getView(view?: string[]) {
  const key = view?.[0] ?? 'overview'
  if ((view?.length ?? 0) > 1 || !Object.hasOwn(views, key)) notFound()
  return key as keyof typeof views
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const key = getView((await params).view)
  return { title: key[0].toUpperCase() + key.slice(1) }
}
export default async function ProjectViewPage({ params }: Props) {
  const { id, view } = await params
  const key = getView(view)
  if (key === 'board') return <Board key={id} projectId={id} />
  if (key === 'list') return <TaskList key={id} projectId={id} />
  return <ProjectInsights key={`${id}-${key}`} projectId={id} overview={key === 'overview'} />
}
