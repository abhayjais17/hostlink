import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import * as api from './api'
import { createSeed } from './seed'
import { domainStore } from './store'
import { groupPersonalTasks } from './utils'

beforeEach(() => {
  domainStore.setState({ ...createSeed(), revision: 0, nextTaskNumber: 12, currentUserId: 'u1' }, true)
  api.configureMockApi({ firstReadDelay: 0, mutationDelay: 0, failNextMutation: false })
})

test('my tasks follows the current user and includes all their projects', async () => {
  for (const user of await api.getUsers()) {
    await api.setCurrentUser(user.id)
    const data = await api.getMyTasks()
    const expected = await api.getTasks(undefined, { assigneeIds: [user.id] })
    assert.equal(data.user.id, user.id)
    assert.equal(data.total, expected.length)
    assert.deepEqual(Object.values(data.groups).flat().map(task => task.id).sort(), expected.map(task => task.id).sort())
    assert.equal(data.open, expected.filter(task => task.status !== 'done').length)
  }
})

test('date buckets use local calendar dates and Monday-start weeks', () => {
  const now = new Date(2026, 8, 30, 23, 59)
  const task = createSeed(now).tasks[0]
  const dates = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-04', '2026-10-05']
  const tasks = dates.map((dueDate, index) => ({ ...task, id: String(index), dueDate, status: 'backlog' as const }))
  const before = structuredClone(tasks)
  const groups = groupPersonalTasks(tasks, now)
  assert.deepEqual(groups.Overdue.map(task => task.id), ['0'])
  assert.deepEqual(groups.Today.map(task => task.id), ['1'])
  assert.deepEqual(groups['This Week'].map(task => task.id), ['2', '3'])
  assert.deepEqual(groups.Later.map(task => task.id), ['4'])
  assert.deepEqual(tasks, before)
  assert.equal(groupPersonalTasks([{ ...task, status: 'done', dueDate: dates[0] }], now).Completed.length, 1)
})

test('Sunday excludes next Monday from this week, and overdue Done is not overdue', () => {
  const now = new Date(2026, 9, 4, 12)
  const task = createSeed(now).tasks[0]
  const groups = groupPersonalTasks([{ ...task, status: 'backlog', dueDate: '2026-10-05' }], now)
  assert.equal(groups.Later.length, 1)
  assert.equal(groups['This Week'].length, 0)
  assert.equal(groupPersonalTasks([task], now).Overdue.length, 0)
})

test('workspace aggregates every project and includes all members', async () => {
  const { analytics, projects, users } = await api.getWorkspaceAnalytics()
  assert.equal(analytics.total, 11)
  assert.equal(projects.length, 2)
  assert.equal(analytics.total, projects.reduce((sum, project) => sum + project.totalTasks, 0))
  assert.equal(analytics.counts.done, projects.reduce((sum, project) => sum + project.doneTasks, 0))
  assert.equal(analytics.workload.reduce((sum, point) => sum + point.total, 0), analytics.total - analytics.counts.done)
  assert.deepEqual(analytics.workload.map(point => point.userId), users.map(user => user.id))
})

test('workspace summaries react to completion, reopening and reassignment', async () => {
  await api.setCurrentUser('u2')
  await api.moveTask('t7', 'review')
  const before = await api.getWorkspaceAnalytics()
  await api.moveTask('t7', 'done')
  const after = await api.getWorkspaceAnalytics()
  assert.equal(after.analytics.counts.done, before.analytics.counts.done + 1)
  assert.equal(after.analytics.overdueCount, before.analytics.overdueCount - 1)
  assert.ok((await api.getMyTasks()).groups.Completed.some(task => task.id === 't7'))
  await api.moveTask('t7', 'review')
  assert.ok((await api.getMyTasks()).groups.Overdue.some(task => task.id === 't7'))
  await api.updateTask('t7', { assigneeId: 'u1' })
  assert.ok(!Object.values((await api.getMyTasks()).groups).flat().some(task => task.id === 't7'))
})

test('workspace ignores project filters and updates for project deletion', async () => {
  const before = await api.getWorkspaceAnalytics()
  api.setTaskFilters('website-revamp', { statuses: ['done'] })
  assert.deepEqual(await api.getWorkspaceAnalytics(), before)
  api.clearTaskFilters('website-revamp')
  await api.deleteProject('mobile-app-v2')
  const after = await api.getWorkspaceAnalytics()
  assert.equal(after.projects.length, 1)
  assert.equal(after.analytics.total, 8)
  await api.deleteProject('website-revamp')
  const empty = await api.getWorkspaceAnalytics()
  assert.equal(empty.analytics.total, 0)
  assert.equal(empty.analytics.completionPct, 0)
  assert.ok(empty.analytics.workload.every(point => point.total === 0))
  assert.equal((await api.getMyTasks()).total, 0)
})

test('failed optimistic mutations restore workspace and personal views', async () => {
  const before = await api.getWorkspaceAnalytics()
  const personal = await api.getMyTasks()
  api.configureMockApi({ mutationDelay: 20, failNextMutation: true })
  const pending = api.updateTask('t6', { assigneeId: 'u2' })
  assert.equal((await api.getMyTasks()).total, personal.total - 1)
  await assert.rejects(pending, /restored/)
  assert.deepEqual(await api.getWorkspaceAnalytics(), before)
  assert.deepEqual(await api.getMyTasks(), personal)
})
