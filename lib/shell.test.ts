import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import * as api from './api'
import { createSeed } from './seed'
import { domainStore, uiStore } from './store'

beforeEach(() => {
  domainStore.setState({ ...createSeed(), revision: 0, nextTaskNumber: 12, currentUserId: 'u1' }, true)
  uiStore.setState({ starredProjectIds: [], sidebarExpanded: true })
  api.configureMockApi({ firstReadDelay: 0, mutationDelay: 0, failNextMutation: false })
})

test('shell preferences go through the API and stars toggle without changing project data', () => {
  const projects = domainStore.getState().projects
  api.setSidebarExpanded(false)
  assert.equal(uiStore.getState().sidebarExpanded, false)
  api.toggleProjectStar('website-revamp')
  assert.deepEqual(uiStore.getState().starredProjectIds, ['website-revamp'])
  api.toggleProjectStar('website-revamp')
  assert.deepEqual(uiStore.getState().starredProjectIds, [])
  assert.equal(domainStore.getState().projects, projects)
  assert.throws(() => api.toggleProjectStar('missing'), api.ApiError)
})

test('search finds seeded projects and tasks by title or key', async () => {
  assert.equal((await api.searchWorkspace('WEBSITE')).projects[0].id, 'website-revamp')
  assert.equal((await api.searchWorkspace(' hl-7 ')).tasks[0].title, 'Fix payment bug')
  assert.equal((await api.searchWorkspace('login')).tasks[0].key, 'HL-4')
  assert.deepEqual(await api.searchWorkspace('not-a-real-result'), { projects: [], tasks: [] })
  assert.equal((await api.searchWorkspace('')).projects.length, 2)
})

test('activity resolves actual actors, tasks and projects, newest first', async () => {
  const activity = await api.getRecentActivity()
  assert.equal(activity.length, 5)
  activity.forEach((event, index) => {
    assert.equal(event.user.id, event.userId)
    assert.equal(event.task.id, event.taskId)
    assert.equal(event.project.id, event.projectId)
    assert.notEqual(event.fromStatus, null)
    if (index) assert.ok(activity[index - 1].createdAt >= event.createdAt)
  })
})

test('switching the demo actor carries through to later task moves', async () => {
  await api.setCurrentUser('u3')
  assert.equal((await api.getCurrentUser()).id, 'u3')
  await api.moveTask('t6', 'in_progress')
  assert.equal((await api.getTaskEvents('t6')).at(-1)?.userId, 'u3')
})
