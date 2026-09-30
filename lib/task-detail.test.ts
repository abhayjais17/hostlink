import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import * as api from './api'
import { createSeed } from './seed'
import { domainStore } from './store'
import { STATUSES, type Status } from './types'
import { isOverdue } from './utils'

beforeEach(() => {
  domainStore.setState({ ...createSeed(), revision: 0, nextTaskNumber: 12, currentUserId: 'u1' }, true)
  api.configureMockApi({ firstReadDelay: 0, mutationDelay: 0, failNextMutation: false })
})
const input = { projectId: 'website-revamp', title: 'Regression task', assigneeId: 'u2', dueDate: '2026-10-01' }
const transitions: Record<Status, Status[]> = { backlog: ['in_progress'], in_progress: ['backlog', 'review'], review: ['in_progress', 'done'], done: ['review'] }

for (const from of STATUSES) test(`edit modal enforces the shared transition matrix from ${from}`, async () => {
  for (const to of STATUSES) {
    const task = await api.createTask({ ...input, status: from })
    const originalEvents = await api.getTaskEvents(task.id)
    if (from === to || transitions[from].includes(to)) {
      const result = await api.updateTask(task.id, { title: 'Edited title', status: to }, 'u3')
      assert.equal(result.status, to)
      assert.equal(result.title, 'Edited title')
      assert.equal((await api.getTaskEvents(task.id)).length, originalEvents.length + (from === to ? 0 : 1))
      if (from !== to) { assert.equal((await api.getTaskEvents(task.id)).at(-1)?.userId, 'u3'); assert.equal(!!result.completedAt, to === 'done') }
    } else {
      await assert.rejects(api.updateTask(task.id, { title: 'Must not be saved', status: to }), api.ApiError)
      assert.deepEqual(await api.getTask(task.id), task)
      assert.deepEqual(await api.getTaskEvents(task.id), originalEvents)
    }
  }
})

test('inline field updates preserve identity, status and history', async () => {
  const before = await api.getTask('t7')
  const events = await api.getTaskEvents('t7')
  const result = await api.updateTask('t7', { title: '  Fix checkout  ', description: 'New context', assigneeId: 'u3', priority: 'high', dueDate: '2026-12-15' })
  assert.equal(result.title, 'Fix checkout')
  assert.equal(result.description, 'New context')
  assert.equal(result.assigneeId, 'u3')
  assert.equal(result.priority, 'high')
  assert.equal(result.dueDate, '2026-12-15')
  assert.equal(result.movedAt, before.movedAt)
  assert.equal(result.createdAt, before.createdAt)
  assert.equal(result.key, before.key)
  assert.deepEqual(await api.getTaskEvents('t7'), events)
})

test('invalid and failed inline saves leave all fields intact', async () => {
  const before = await api.getTask('t7')
  await assert.rejects(api.updateTask('t7', { title: '  ' }), /required/)
  await assert.rejects(api.updateTask('t7', { dueDate: '2026-02-30' }), /due date/)
  api.configureMockApi({ failNextMutation: true })
  await assert.rejects(api.updateTask('t7', { description: 'Unsaved draft' }), /restored/)
  assert.deepEqual(await api.getTask('t7'), before)
})

test('create form requires title, member and valid date', async () => {
  await assert.rejects(api.createTask({ ...input, title: '' }), /required/)
  await assert.rejects(api.createTask({ ...input, assigneeId: '' }), /member/)
  await assert.rejects(api.createTask({ ...input, dueDate: '' }), /due date/)
  const project = await api.createProject({ name: 'Limited team', description: '', color: 'teal', memberIds: ['u1'] })
  await assert.rejects(api.createTask({ ...input, projectId: project.id }), /member of this project/)
  assert.equal((await api.getTasks()).length, 11)
})

test('create defaults and column status produce consistent timestamps and history', async () => {
  const task = await api.createTask(input)
  assert.equal(task.status, 'backlog'); assert.equal(task.priority, 'normal'); assert.equal(task.key, 'HL-12')
  assert.equal(task.completedAt, null)
  const done = await api.createTask({ ...input, status: 'done' })
  assert.ok(done.completedAt)
  assert.equal((await api.getTaskEvents(done.id))[0].fromStatus, null)
  assert.equal((await api.getTaskEvents(done.id))[0].toStatus, 'done')
})

test('drawer move updates overdue, completion and history with current actor', async () => {
  await api.setCurrentUser('u3')
  await api.moveTask('t7', 'review')
  await api.moveTask('t7', 'done')
  assert.equal(isOverdue(await api.getTask('t7')), false)
  assert.equal((await api.getTaskEvents('t7')).at(-1)?.userId, 'u3')
  await api.moveTask('t7', 'review')
  assert.equal(isOverdue(await api.getTask('t7')), true)
  assert.equal((await api.getTask('t7')).completedAt, null)
})

test('comments use selected actor and update board/list counts', async () => {
  const before = (await api.getBoardCommentCounts(input.projectId)).t7
  await api.setCurrentUser('u3')
  const actor = await api.getCurrentUser()
  const comment = await api.addComment('t7', actor.id, '  Verified the checkout fix.  ')
  assert.equal(comment.authorId, 'u3')
  assert.equal(comment.body, 'Verified the checkout fix.')
  assert.equal((await api.getComments('t7')).at(-1)?.id, comment.id)
  assert.equal((await api.getBoardCommentCounts(input.projectId)).t7, before + 1)
  await api.deleteComment(comment.id)
  assert.equal((await api.getBoardCommentCounts(input.projectId)).t7, before)
})

test('blank or failed comments never remain in the thread', async () => {
  const before = await api.getComments('t7')
  await assert.rejects(api.addComment('t7', 'u1', '  '), /required/)
  api.configureMockApi({ failNextMutation: true })
  await assert.rejects(api.addComment('t7', 'u1', 'Keep my draft'), /restored/)
  assert.deepEqual(await api.getComments('t7'), before)
})

test('failed edit rolls back fields, status, history and summary', async () => {
  const before = await api.getTask('t7')
  const events = await api.getTaskEvents('t7')
  const analytics = await api.getAnalytics(input.projectId)
  api.configureMockApi({ failNextMutation: true })
  await assert.rejects(api.updateTask('t7', { title: 'New title', status: 'review', assigneeId: 'u3' }), /restored/)
  assert.deepEqual(await api.getTask('t7'), before)
  assert.deepEqual(await api.getTaskEvents('t7'), events)
  assert.deepEqual(await api.getAnalytics(input.projectId), analytics)
})

test('failed delete restores the task, comments and history', async () => {
  const before = await api.getTask('t7')
  const comments = await api.getComments('t7')
  const events = await api.getTaskEvents('t7')
  api.configureMockApi({ failNextMutation: true })
  await assert.rejects(api.deleteTask('t7'), /restored/)
  assert.deepEqual(await api.getTask('t7'), before)
  assert.deepEqual(await api.getComments('t7'), comments)
  assert.deepEqual(await api.getTaskEvents('t7'), events)
})

test('confirmed delete cascades without affecting other tasks', async () => {
  const other = await api.getTask('t4')
  const otherComments = await api.getComments('t4')
  await api.deleteTask('t7')
  await assert.rejects(api.getTask('t7'), /not found/)
  assert.equal(domainStore.getState().comments.some(comment => comment.taskId === 't7'), false)
  assert.equal(domainStore.getState().events.some(event => event.taskId === 't7'), false)
  assert.deepEqual(await api.getTask('t4'), other)
  assert.deepEqual(await api.getComments('t4'), otherComments)
})
