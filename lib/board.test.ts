import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { addDays, format } from 'date-fns'
import * as api from './api'
import { createSeed } from './seed'
import { domainStore } from './store'

beforeEach(() => {
  domainStore.setState({ ...createSeed(), revision: 0, nextTaskNumber: 12, currentUserId: 'u1' }, true)
  api.configureMockApi({ firstReadDelay: 0, mutationDelay: 0, failNextMutation: false })
})

test('board comment counts include zeroes and stay scoped to the project', async () => {
  const counts = await api.getBoardCommentCounts('website-revamp')
  assert.equal(Object.keys(counts).length, 8)
  assert.equal(counts.t4 + counts.t7, 5)
  assert.equal(counts.t6, 0)
  counts.t6 = 100
  assert.equal((await api.getBoardCommentCounts('website-revamp')).t6, 0)
  await api.addComment('t6', 'u1', 'Ready to start')
  assert.equal((await api.getBoardCommentCounts('website-revamp')).t6, 1)
  assert.equal(Object.values(await api.getBoardCommentCounts('mobile-app-v2')).reduce((sum, n) => sum + n, 0), 0)
  await assert.rejects(api.getBoardCommentCounts('missing'), api.ApiError)
})

test('quick add supplies valid defaults, actor, history, and a new board count', async () => {
  const task = await api.quickAddTask('website-revamp', '  Check board interactions  ')
  assert.equal(task.title, 'Check board interactions')
  assert.equal(task.key, 'HL-12')
  assert.equal(task.status, 'backlog')
  assert.equal(task.priority, 'normal')
  assert.equal(task.assigneeId, 'u1')
  assert.equal(task.dueDate, format(addDays(new Date(), 7), 'yyyy-MM-dd'))
  assert.equal((await api.getTaskEvents(task.id))[0].userId, 'u1')
  assert.equal((await api.getAnalytics('website-revamp')).counts.backlog, 3)
  assert.equal((await api.getBoardCommentCounts('website-revamp'))[task.id], 0)
  await assert.rejects(api.quickAddTask('website-revamp', '   '), api.ApiError)
})

test('quick add assigns a project member even when the actor is not a member', async () => {
  const project = await api.createProject({ name: 'Design only', description: '', color: 'teal', memberIds: ['u3'] })
  const task = await api.quickAddTask(project.id, 'Design review')
  assert.equal(task.assigneeId, 'u3')
  assert.equal((await api.getTaskEvents(task.id))[0].userId, 'u1')
})

test('failed quick add restores counts, history, and the next task key', async () => {
  const before = await api.getTasks('website-revamp')
  api.configureMockApi({ failNextMutation: true })
  await assert.rejects(api.quickAddTask('website-revamp', 'Failed task'), api.ApiError)
  assert.deepEqual(await api.getTasks('website-revamp'), before)
  assert.equal((await api.quickAddTask('website-revamp', 'Retry task')).key, 'HL-12')
})
