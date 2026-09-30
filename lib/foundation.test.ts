import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { addDays, format } from 'date-fns'
import * as api from './api'
import { createSeed } from './seed'
import { domainStore, uiStore } from './store'
import { allowedTransitions, computeBurndown, daysOverdue, isOverdue } from './utils'
import { STATUSES, type Status, type Task } from './types'

beforeEach(() => {
  domainStore.setState({ ...createSeed(), revision: 0, nextTaskNumber: 12, currentUserId: 'u1' }, true)
  api.configureMockApi({ firstReadDelay: 0, mutationDelay: 0, failNextMutation: false })
})

test('seed has the exact teams, projects, tasks, overdue dates, and coherent histories', async () => {
  const users = await api.getUsers()
  const projects = await api.getProjects()
  const tasks = await api.getTasks()
  assert.equal(users.length, 3)
  assert.equal(projects.length, 2)
  assert.equal(tasks.length, 11)
  assert.equal(tasks.filter(t => t.projectId === 'website-revamp').length, 8)
  assert.equal(tasks.filter(t => t.projectId === 'mobile-app-v2').length, 3)
  assert.equal(tasks.filter(t => isOverdue(t)).length, 1)
  assert.equal(daysOverdue(tasks.find(t => t.key === 'HL-7')!), 4)
  assert.equal((await api.getComments('t4')).length + (await api.getComments('t7')).length, 5)
  for (const task of tasks) {
    const history = await api.getTaskEvents(task.id)
    assert.equal(history[0].fromStatus, null)
    assert.equal(history.at(-1)!.toStatus, task.status)
    assert.equal(history.at(-1)!.createdAt, task.movedAt)
    for (const event of history.slice(1)) assert.ok(allowedTransitions(event.fromStatus!).includes(event.toStatus))
  }
  assert.equal((await api.getAnalytics('website-revamp')).completionPct, 25)
})

test('all sixteen transitions obey the matrix, stamp moves, and record the actor', async () => {
  const expected: Record<Status, Status[]> = { backlog: ['in_progress'], in_progress: ['backlog', 'review'], review: ['in_progress', 'done'], done: ['review'] }
  for (const from of STATUSES) for (const to of STATUSES) {
    const task = domainStore.getState().tasks[0]
    domainStore.setState({ tasks: [{ ...task, status: from, movedAt: '2020-01-01T00:00:00.000Z' }] })
    const before = domainStore.getState()
    if (expected[from].includes(to)) {
      const moved = await api.moveTask(task.id, to, 'u3')
      assert.equal(moved.status, to)
      assert.notEqual(moved.movedAt, '2020-01-01T00:00:00.000Z')
      assert.equal(moved.completedAt, to === 'done' ? moved.movedAt : null)
      const event = domainStore.getState().events.at(-1)!
      assert.equal(event.userId, 'u3')
      assert.equal(event.fromStatus, from)
      assert.equal(event.toStatus, to)
    } else {
      await assert.rejects(api.moveTask(task.id, to, 'u3'), (error: api.ApiError) => {
        assert.equal(error.code, 'INVALID_TRANSITION')
        assert.deepEqual(error.allowed, expected[from])
        return true
      })
      assert.equal(domainStore.getState(), before)
    }
  }
})

test('generic edits cannot bypass transitions or overwrite identity fields', async () => {
  const before = await api.getTask('t6')
  await assert.rejects(api.updateTask('t6', { title: 'Should not be saved', status: 'done' }), api.ApiError)
  assert.deepEqual(await api.getTask('t6'), before)
  const updated = await api.updateTask('t6', { status: 'in_progress', title: 'Documentation draft', ...({ id: 'hijack', completedAt: 'fake' } as object) })
  assert.equal(updated.id, 't6')
  assert.equal(updated.completedAt, null)
  assert.equal(updated.title, 'Documentation draft')
  assert.equal((await api.getTaskEvents('t6')).at(-1)!.toStatus, 'in_progress')
})

test('overdue uses local calendar dates and disappears when Done, returning on reopen', async () => {
  const now = new Date(2026, 8, 28, 23, 59)
  const template = await api.getTask('t7')
  assert.equal(isOverdue({ ...template, dueDate: '2026-09-28' }, now), false)
  assert.equal(daysOverdue({ ...template, dueDate: '2026-09-24' }, now), 4)
  assert.equal(isOverdue({ ...template, dueDate: '2026-09-24', status: 'done' }, now), false)
  await api.moveTask('t7', 'review')
  await api.moveTask('t7', 'done')
  assert.equal((await api.getAnalytics('website-revamp')).overdueCount, 0)
  assert.equal((await api.getAnalytics('website-revamp')).counts.done, 3)
  await api.moveTask('t7', 'review')
  assert.equal(isOverdue(await api.getTask('t7')), true)
  assert.equal((await api.getTask('t7')).completedAt, null)
})

test('burndown replays completion and reopening, and excludes future tasks', () => {
  const now = new Date(2026, 8, 28, 12)
  const data = createSeed(now)
  const tasks = data.tasks.filter(t => t.projectId === 'website-revamp')
  const initial = computeBurndown(data.events, tasks, now)
  assert.equal(initial.length, 10)
  assert.equal(initial[0].remaining, 8)
  assert.equal(initial.at(-1)!.remaining, 6)
  assert.equal(initial.at(-1)!.done, 2)
  const reopened = [...data.events, { id: 'reopen', taskId: 't1', projectId: 'website-revamp', userId: 'u1', fromStatus: 'done' as const, toStatus: 'review' as const, createdAt: now.toISOString() }]
  assert.equal(computeBurndown(reopened, tasks, now).at(-1)!.done, 1)
  const future: Task = { ...tasks[0], id: 'future', createdAt: addDays(now, 1).toISOString() }
  assert.equal(computeBurndown(reopened, [...tasks, future], now).at(-1)!.total, 8)
})

test('filter dimensions combine with AND and reads are detached copies', async () => {
  const tasks = await api.getTasks('website-revamp', { search: 'BUG', assigneeIds: ['u2'], priorities: ['urgent'], statuses: ['in_progress'] })
  assert.deepEqual(tasks.map(t => t.key), ['HL-7'])
  tasks[0].title = 'External mutation'
  assert.equal((await api.getTask('t7')).title, 'Fix payment bug')
  assert.equal((await api.getTasks('website-revamp', { assigneeIds: ['u3'], priorities: ['urgent'] })).length, 0)
  uiStore.getState().setFilters('website-revamp', { priorities: ['urgent'] })
  uiStore.getState().setActiveProject('mobile-app-v2')
  assert.deepEqual(uiStore.getState().filtersByProject['website-revamp'], { priorities: ['urgent'] })
})

test('optimistic updates notify immediately and injected failure rolls back atomically', async () => {
  const old = await api.getTask('t7')
  const history = await api.getTaskEvents('t7')
  const revisions: number[] = []
  const unsubscribe = domainStore.subscribe(state => revisions.push(state.revision))
  api.configureMockApi({ failNextMutation: true, mutationDelay: 10 })
  const result = api.moveTask('t7', 'review')
  assert.equal(domainStore.getState().tasks.find(t => t.id === 't7')!.status, 'review')
  await assert.rejects(result, (error: api.ApiError) => error.code === 'NETWORK')
  assert.deepEqual(await api.getTask('t7'), old)
  assert.deepEqual(await api.getTaskEvents('t7'), history)
  assert.equal(revisions.length, 2)
  assert.ok(revisions[1] > revisions[0])
  unsubscribe()
})

test('overlapping writes cannot corrupt rollback snapshots', async () => {
  api.configureMockApi({ mutationDelay: 10 })
  const pending = api.moveTask('t7', 'review')
  await assert.rejects(api.deleteProject('website-revamp'), (error: api.ApiError) => error.code === 'BUSY')
  await pending
  assert.equal((await api.getTask('t7')).status, 'review')
})

test('CRUD validates fields, uses unique keys, updates workload, and cascades deletions', async () => {
  const dueDate = format(addDays(new Date(), 7), 'yyyy-MM-dd')
  await assert.rejects(api.createTask({ projectId: 'website-revamp', title: ' ', assigneeId: 'u1', dueDate }), api.ApiError)
  await assert.rejects(api.createTask({ projectId: 'website-revamp', title: 'Bad date', assigneeId: 'u1', dueDate: '2026-02-30' }), api.ApiError)
  const task = await api.createTask({ projectId: 'website-revamp', title: ' New task ', assigneeId: 'u1', dueDate })
  assert.equal(task.key, 'HL-12')
  assert.equal(task.status, 'backlog')
  assert.equal(task.priority, 'normal')
  assert.equal(task.title, 'New task')
  const comment = await api.addComment(task.id, 'u3', ' A comment ')
  assert.equal(comment.body, 'A comment')
  await api.updateTask(task.id, { assigneeId: 'u2' })
  assert.equal((await api.getAnalytics('website-revamp')).workload.find(u => u.userId === 'u2')!.total, 3)
  await api.deleteTask(task.id)
  assert.equal(domainStore.getState().comments.some(c => c.id === comment.id), false)
  const next = await api.createTask({ projectId: 'website-revamp', title: 'Another task', assigneeId: 'u1', dueDate })
  assert.equal(next.key, 'HL-13')
  await api.deleteProject('website-revamp')
  assert.equal((await api.getTasks()).length, 3)
  assert.equal(domainStore.getState().comments.length, 0)
  assert.equal(domainStore.getState().events.some(e => e.projectId === 'website-revamp'), false)
})

test('project CRUD and acting user stay behind the API', async () => {
  const project = await api.createProject({ name: 'Release plan', description: '', color: 'teal', memberIds: ['u1', 'u1'] })
  assert.deepEqual(project.memberIds, ['u1'])
  assert.equal((await api.getAnalytics(project.id)).completionPct, 0)
  await api.updateProject(project.id, { name: 'Release checklist' })
  assert.equal((await api.getProject(project.id)).name, 'Release checklist')
  await assert.rejects(api.updateProject('website-revamp', { memberIds: ['u1'] }), api.ApiError)
  await api.setCurrentUser('u2')
  assert.equal((await api.getCurrentUser()).id, 'u2')
  await api.moveTask('t6', 'in_progress')
  assert.equal((await api.getTaskEvents('t6')).at(-1)!.userId, 'u2')
  await api.deleteProject(project.id)
  await assert.rejects(api.getProject(project.id), api.ApiError)
})
