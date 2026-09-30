import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import * as api from './api'
import { createSeed } from './seed'
import { domainStore } from './store'
import { computeAnalytics } from './utils'

const projectId = 'website-revamp'
beforeEach(() => {
  domainStore.setState({ ...createSeed(), revision: 0, nextTaskNumber: 12, currentUserId: 'u1' }, true)
  api.configureMockApi({ firstReadDelay: 0, mutationDelay: 0, failNextMutation: false })
})

test('analytics starts with coherent completion, history and member workload', async () => {
  const data = await api.getAnalytics(projectId)
  assert.equal(data.total, 8)
  assert.equal(data.completionPct, 25)
  assert.deepEqual(data.counts, { backlog: 2, in_progress: 3, review: 1, done: 2 })
  assert.equal(data.overdueCount, 1)
  assert.equal(data.burndown.length, 10)
  assert.deepEqual(data.burndown.map(point => point.total), Array(10).fill(8))
  assert.equal(data.burndown[0].done, 0)
  assert.equal(data.burndown.at(-1)?.done, data.counts.done)
  assert.equal(data.workload.reduce((total, user) => total + user.total, 0), 6)
  for (const user of data.workload) assert.equal(user.total, user.backlog + user.in_progress + user.review)
})

test('completion, burndown, workload and overdue update on move and reopen', async () => {
  const before = await api.getAnalytics(projectId)
  await api.moveTask('t7', 'review')
  const reviewing = await api.getAnalytics(projectId)
  assert.equal(reviewing.workload.find(user => user.userId === 'u2')?.review, 1)
  assert.equal(reviewing.counts.in_progress, before.counts.in_progress - 1)
  await api.moveTask('t7', 'done')
  const done = await api.getAnalytics(projectId)
  assert.equal(done.completionPct, 38)
  assert.equal(done.overdueCount, 0)
  assert.equal(done.burndown.at(-1)?.done, 3)
  assert.equal(done.burndown.at(-1)?.remaining, 5)
  assert.equal(done.workload.find(user => user.userId === 'u2')?.total, 1)
  assert.deepEqual(done.burndown.slice(0, -1), before.burndown.slice(0, -1))
  await api.moveTask('t7', 'review')
  const reopened = await api.getAnalytics(projectId)
  assert.equal(reopened.completionPct, 25)
  assert.equal(reopened.overdueCount, 1)
  assert.equal(reopened.burndown.at(-1)?.remaining, 6)
})

test('new tasks affect only current scope and reassignment changes workload', async () => {
  const before = await api.getAnalytics(projectId)
  const other = await api.getAnalytics('mobile-app-v2')
  const task = await api.createTask({ projectId, title: 'Scope addition', assigneeId: 'u1', dueDate: '2026-12-01' })
  const created = await api.getAnalytics(projectId)
  assert.equal(created.total, 9)
  assert.equal(created.burndown.at(-1)?.total, 9)
  assert.deepEqual(created.burndown.slice(0, -1), before.burndown.slice(0, -1))
  await api.updateTask(task.id, { assigneeId: 'u3' })
  const reassigned = await api.getAnalytics(projectId)
  assert.equal(reassigned.workload.find(user => user.userId === 'u1')?.total, 1)
  assert.equal(reassigned.workload.find(user => user.userId === 'u3')?.total, 4)
  await api.deleteTask(task.id)
  assert.deepEqual(await api.getAnalytics(projectId), before)
  assert.deepEqual(await api.getAnalytics('mobile-app-v2'), other)
})

test('optimistic analytics update immediately and recover after failed writes', async () => {
  const before = await api.getAnalytics(projectId)
  api.configureMockApi({ mutationDelay: 10, failNextMutation: true })
  const pending = api.moveTask('t2', 'done')
  assert.equal((await api.getAnalytics(projectId)).counts.done, 3)
  await assert.rejects(pending, /restored/)
  assert.deepEqual(await api.getAnalytics(projectId), before)
})

test('invalid moves and board filters never corrupt project analytics', async () => {
  const before = await api.getAnalytics(projectId)
  api.setTaskFilters(projectId, { statuses: ['done'], assigneeIds: ['u2'] })
  assert.deepEqual(await api.getAnalytics(projectId), before)
  await assert.rejects(api.moveTask('t6', 'done'), /In Progress first/)
  assert.deepEqual(await api.getAnalytics(projectId), before)
  api.clearTaskFilters(projectId)
})

test('empty projects have zero completion, ten zero days and all member rows', async () => {
  const project = await api.createProject({ name: 'Empty analytics', description: '', color: 'teal', memberIds: ['u1', 'u3'] })
  const data = await api.getAnalytics(project.id)
  assert.equal(data.total, 0)
  assert.equal(data.completionPct, 0)
  assert.equal(data.overdueCount, 0)
  assert.equal(data.burndown.length, 10)
  assert.ok(data.burndown.every(day => day.total === 0 && day.done === 0 && day.remaining === 0))
  assert.deepEqual(data.workload.map(user => user.userId), ['u1', 'u3'])
  assert.ok(data.workload.every(user => user.total === 0))
})

test('overdue list and count share one snapshot through completion and reopen', async () => {
  const before = await api.getAnalytics(projectId)
  assert.deepEqual(before.overdueTasks.map(task => task.id), ['t7'])
  await api.moveTask('t7', 'review')
  await api.moveTask('t7', 'done')
  const completed = await api.getAnalytics(projectId)
  assert.equal(completed.overdueTasks.length, completed.overdueCount)
  assert.deepEqual(completed.overdueTasks, [])
  await api.moveTask('t7', 'review')
  const reopened = await api.getAnalytics(projectId)
  assert.equal(reopened.overdueTasks.length, reopened.overdueCount)
  assert.equal(reopened.overdueTasks[0].status, 'review')
})

test('overdue uses calendar days, excludes Done, and sorts oldest first without mutating tasks', () => {
  const now = new Date(2026, 8, 30, 12)
  const seed = createSeed(now)
  const tasks = seed.tasks.filter(task => task.projectId === projectId).map(task => ({
    ...task, dueDate: task.id === 't6' ? '2026-09-20' : task.id === 't8' ? '2026-09-30' : task.dueDate,
  }))
  const ids = tasks.map(task => task.id)
  const data = computeAnalytics(tasks, seed.events, seed.users, now)
  assert.deepEqual(data.overdueTasks.map(task => task.id), ['t6', 't7'])
  assert.equal(data.overdueCount, 2)
  assert.deepEqual(tasks.map(task => task.id), ids)
})

test('creating a completed task updates scope and completion only on its creation day', async () => {
  const before = await api.getAnalytics(projectId)
  await api.createTask({ projectId, title: 'Completed on arrival', assigneeId: 'u1', dueDate: '2026-01-01', status: 'done' })
  const after = await api.getAnalytics(projectId)
  assert.equal(after.total, 9)
  assert.equal(after.counts.done, 3)
  assert.equal(after.completionPct, 33)
  assert.equal(after.overdueCount, before.overdueCount)
  assert.deepEqual(after.burndown.slice(0, -1), before.burndown.slice(0, -1))
  assert.equal(after.burndown.at(-1)?.remaining, 6)
  assert.deepEqual(after.workload, before.workload)
})

test('historical reopen preserves earlier completion and current remaining counts', () => {
  const now = new Date(2026, 8, 30, 12)
  const seed = createSeed(now)
  const task = { ...seed.tasks[0], status: 'review' as const, completedAt: null }
  const reopenedAt = new Date(2026, 8, 28, 12).toISOString()
  const events = [...seed.events, { id: 'reopen', taskId: task.id, projectId, userId: 'u1', fromStatus: 'done' as const, toStatus: 'review' as const, createdAt: reopenedAt }]
  const data = computeAnalytics([task], events, seed.users, now)
  assert.equal(data.burndown.find(day => day.date === '2026-09-27')?.done, 1)
  assert.equal(data.burndown.find(day => day.date === '2026-09-28')?.done, 0)
  assert.equal(data.burndown.at(-1)?.remaining, 1)
  assert.equal(data.completionPct, 0)
})

test('workload separates members with matching display names and retains zero rows', () => {
  const now = new Date(2026, 8, 30, 12)
  const seed = createSeed(now)
  const users = seed.users.map(user => ({ ...user, name: 'Alex Smith' }))
  const data = computeAnalytics([seed.tasks[3]], seed.events, users, now)
  assert.deepEqual(data.workload.map(user => [user.userId, user.total]), [['u1', 0], ['u2', 1], ['u3', 0]])
})

test('all-done projects report 100 percent with no open workload or overdue', () => {
  const now = new Date(2026, 8, 30, 12)
  const seed = createSeed(now)
  const tasks = seed.tasks.map(task => ({ ...task, status: 'done' as const }))
  const events = tasks.map(task => ({ id: `done-${task.id}`, taskId: task.id, projectId: task.projectId, userId: task.assigneeId, fromStatus: null, toStatus: 'done' as const, createdAt: task.createdAt }))
  const data = computeAnalytics(tasks, events, seed.users, now)
  assert.equal(data.completionPct, 100)
  assert.equal(data.overdueCount, 0)
  assert.equal(data.burndown.at(-1)?.remaining, 0)
  assert.ok(data.workload.every(user => user.total === 0))
})
