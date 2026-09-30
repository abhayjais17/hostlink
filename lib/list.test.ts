import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import * as api from './api'
import { createSeed } from './seed'
import { domainStore, uiStore } from './store'
import { isOverdue, sortTasks, taskPage } from './utils'

const projectId = 'website-revamp'
beforeEach(() => {
  domainStore.setState({ ...createSeed(), revision: 0, nextTaskNumber: 12, currentUserId: 'u1' }, true)
  uiStore.setState({ filtersByProject: {} })
  api.configureMockApi({ firstReadDelay: 0, mutationDelay: 0, failNextMutation: false })
})

test('filters combine with AND across groups and OR within each group', async () => {
  const tasks = await api.getTasks(projectId, { assigneeIds: ['u2', 'u3'], priorities: ['urgent', 'high'], statuses: ['in_progress', 'review'], search: '  BUG  ' })
  assert.deepEqual(tasks.map(task => task.key), ['HL-7'])
  assert.equal((await api.getTasks(projectId, { assigneeIds: ['u1'], priorities: ['urgent'] })).length, 0)
  assert.equal((await api.getTasks(projectId, { search: '   ', assigneeIds: [], priorities: [], statuses: [] })).length, 8)
})

test('filter API merges fields, isolates projects, and does not mutate domain data', async () => {
  const before = await api.getTasks(projectId)
  const priorities: ('urgent' | 'high')[] = ['urgent']
  api.setTaskFilters(projectId, { priorities })
  priorities.push('high')
  api.setTaskFilters(projectId, { search: 'bug', statuses: ['in_progress'] })
  api.setTaskFilters('mobile-app-v2', { assigneeIds: ['u1'] })
  assert.deepEqual(uiStore.getState().filtersByProject[projectId], { priorities: ['urgent'], search: 'bug', statuses: ['in_progress'] })
  assert.equal((await api.getTasks(projectId, uiStore.getState().filtersByProject[projectId])).length, 1)
  api.clearTaskFilters(projectId)
  assert.deepEqual(uiStore.getState().filtersByProject[projectId], {})
  assert.deepEqual(uiStore.getState().filtersByProject['mobile-app-v2'], { assigneeIds: ['u1'] })
  assert.deepEqual(await api.getTasks(projectId), before)
  assert.throws(() => api.setTaskFilters('missing', {}), api.ApiError)
})

test('sorting uses chronological dates, priority severity and workflow order without mutating input', async () => {
  const tasks = await api.getTasks(projectId)
  const before = structuredClone(tasks)
  for (const field of ['dueDate', 'priority', 'status'] as const) {
    const asc = sortTasks(tasks, { field, direction: 'asc' })
    const desc = sortTasks(tasks, { field, direction: 'desc' })
    assert.equal(asc[0][field], desc.at(-1)![field])
  }
  assert.equal(sortTasks(tasks, { field: 'priority', direction: 'asc' })[0].priority, 'urgent')
  assert.equal(sortTasks(tasks, { field: 'status', direction: 'asc' })[0].status, 'backlog')
  assert.deepEqual(sortTasks([...tasks].reverse(), null).map(task => task.key), tasks.map(task => task.key))
  assert.deepEqual(tasks, before)
})

test('pagination clamps after filtering and reports correct empty and last-page ranges', async () => {
  const tasks = await api.getTasks(projectId)
  const first = taskPage(tasks, 1, 5)
  const last = taskPage(tasks, 2, 5)
  assert.deepEqual([first.first, first.last, first.pageCount], [1, 5, 2])
  assert.deepEqual([last.first, last.last, last.items.length], [6, 8, 3])
  assert.equal(taskPage(tasks.slice(0, 1), 2, 5).page, 1)
  assert.deepEqual(taskPage([], 9, 5), { items: [], page: 1, pageCount: 1, first: 0, last: 0 })
})

test('inline moves use validation, filtered membership, history and overdue lifecycle', async () => {
  await assert.rejects(api.moveTask('t7', 'done'), /Review/)
  await api.moveTask('t7', 'review')
  assert.equal((await api.getTasks(projectId, { statuses: ['in_progress'] })).some(task => task.id === 't7'), false)
  assert.equal(isOverdue(await api.getTask('t7')), true)
  await api.moveTask('t7', 'done')
  const done = await api.getTask('t7')
  assert.equal(isOverdue(done), false)
  assert.ok(done.completedAt)
  assert.equal((await api.getTaskEvents('t7')).at(-1)?.toStatus, 'done')
  await api.moveTask('t7', 'review')
  assert.equal(isOverdue(await api.getTask('t7')), true)
  assert.equal((await api.getTask('t7')).completedAt, null)
})

test('failed inline move restores filtered results and history', async () => {
  const before = await api.getTasks(projectId, { statuses: ['in_progress'] })
  const history = await api.getTaskEvents('t7')
  api.configureMockApi({ failNextMutation: true })
  await assert.rejects(api.moveTask('t7', 'review'), /restored/)
  assert.deepEqual(await api.getTasks(projectId, { statuses: ['in_progress'] }), before)
  assert.deepEqual(await api.getTaskEvents('t7'), history)
})
