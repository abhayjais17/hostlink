import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { MyTasksPage } from '@/components/workspace/my-tasks'
import { WorkspaceAnalyticsPage } from '@/components/workspace/workspace-analytics'
import { TeamPage } from '@/components/workspace/team'
import { SettingsPage } from '@/components/workspace/settings'

const sections = {
  dashboard: { label: 'Home' },
  'my-tasks': { label: 'My Tasks' },
  analytics: { label: 'Analytics' },
  team: { label: 'Team' },
  settings: { label: 'Settings' },
}
type Props = { params: Promise<{ section: string }> }
function getSection(section: string) {
  if (!Object.hasOwn(sections, section)) notFound()
  return sections[section as keyof typeof sections]
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getSection((await params).section).label }
}
export default async function SecondaryShellPage({ params }: Props) {
  const key = (await params).section
  const section = getSection(key)
  const descriptions: Record<string, string> = {
    'my-tasks': 'A clear view of your priorities, wherever the work lives.',
    analytics: 'Progress, pace, and capacity across your whole workspace.',
    team: 'Get to know your teammates and see how work is shared.',
    settings: 'Make Hostlink feel a little more like you.',
  }
  return <><header className="border-b bg-surface px-4 py-5 sm:px-7"><Breadcrumbs items={[{ label: 'Workspace', href: '/projects' }, { label: section.label }]} /><h1 className="mt-4 text-xl font-semibold">{section.label}</h1>{descriptions[key] && <p className="mt-1 text-xs text-muted-foreground">{descriptions[key]}</p>}</header>{key === 'my-tasks' ? <MyTasksPage /> : key === 'analytics' ? <WorkspaceAnalyticsPage /> : key === 'team' ? <TeamPage /> : key === 'settings' ? <SettingsPage /> : <WorkspaceAnalyticsPage />}</>
}
