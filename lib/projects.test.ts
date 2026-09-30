import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import * as api from './api'
import { createSeed } from './seed'
import { domainStore } from './store'

beforeEach(() => {
  domainStore.setState({ ...createSeed(), revision: 0, nextTaskNumber: 12, currentUserId: 'u1' }, true)
  api.configureMockApi({ firstReadDelay: 0, mutationDelay: 0, failNextMutation: false })
})

test('project cards and table receive matching counts, members and latest activity', async () => {
  const summaries = await api.getProjectSummaries()
  assert.equal(summaries.length, 2)
  const website = summaries.find(item => item.project.id === 'website-revamp')!
  assert.equal(website.totalTasks, 8)
  assert.equal(website.doneTasks, 2)
  assert.equal(website.completionPct, 25)
  assert.equal(website.overdueCount, 1)
  assert.equal(website.members.length, 3)
  assert.equal(website.lastUpdated, domainStore.getState().comments.at(-1)!.createdAt)
  assert.equal(summaries.find(item => item.project.id === 'mobile-app-v2')!.totalTasks, 3)
  website.project.name = 'Changed snapshot'
  assert.equal((await api.getProject('website-revamp')).name, 'Website Revamp')
})

test('creating a project returns a newest-first zero-task summary with selected members', async () => {
  const project = await api.createProject({ name: '  Release planning  ', description: ' Next launch ', color: 'violet', memberIds: ['u2', 'u3'] })
  const [summary] = await api.getProjectSummaries()
  assert.equal(summary.project.id, project.id)
  assert.equal(summary.project.name, 'Release planning')
  assert.equal(summary.project.description, 'Next launch')
  assert.equal(summary.project.color, 'violet')
  assert.equal(summary.totalTasks, 0)
  assert.equal(summary.completionPct, 0)
  assert.equal(summary.overdueCount, 0)
  assert.deepEqual(summary.members.map(user => user.id), ['u2', 'u3'])
  assert.equal(summary.lastUpdated, project.createdAt)
})

test('project validation and failed saves leave summaries unchanged', async () => {
  const input = { name: 'New project', description: '', color: 'blue', memberIds: ['u1'] }
  await assert.rejects(api.createProject({ ...input, name: ' ' }), /Project name is required/)
  await assert.rejects(api.createProject({ ...input, name: 'x'.repeat(101) }), /100 characters/)
  await assert.rejects(api.createProject({ ...input, memberIds: [] }), /at least one/)
  await assert.rejects(api.createProject({ ...input, memberIds: ['missing'] }), /valid team member/)
  await assert.rejects(api.createProject({ ...input, color: 'missing' }), /supported project color/)
  api.configureMockApi({ failNextMutation: true })
  await assert.rejects(api.createProject(input), /restored/)
  assert.equal((await api.getProjectSummaries()).length, 2)
})

test('summaries refresh after task moves and project metadata updates', async () => {
  await api.moveTask('t2', 'done')
  const summary = (await api.getProjectSummaries()).find(item => item.project.id === 'website-revamp')!
  assert.equal(summary.doneTasks, 3)
  assert.equal(summary.completionPct, 38)
  await api.updateProject('mobile-app-v2', { description: 'Updated project scope' })
  const mobile = (await api.getProjectSummaries()).find(item => item.project.id === 'mobile-app-v2')!
  assert.equal(mobile.lastUpdated, mobile.project.updatedAt)
})

test('an empty workspace produces an empty project collection', async () => {
  for (const project of await api.getProjects()) await api.deleteProject(project.id)
  assert.deepEqual(await api.getProjectSummaries(), [])
})
