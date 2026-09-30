import { PrismaClient } from '@prisma/client'
import { addDays, format, startOfDay, subHours, subMinutes } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  const now = new Date()
  const day = (offset: number) => addDays(startOfDay(now), offset)
  const stamp = (offset: number) => day(offset).toISOString()

  // Create users
  const users = await Promise.all([
    prisma.user.create({ data: { id: 'u1', name: 'Asha Verma', email: 'asha@hostlink.demo', role: 'Team Lead', color: 'teal' } }),
    prisma.user.create({ data: { id: 'u2', name: 'Rohan Mehta', email: 'rohan@hostlink.demo', role: 'Developer', color: 'indigo' } }),
    prisma.user.create({ data: { id: 'u3', name: 'Meera Nair', email: 'meera@hostlink.demo', role: 'Designer', color: 'amber' } }),
  ])

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        id: 'website-revamp',
        name: 'Website Revamp',
        description: 'Redesign and rebuild the company website',
        color: 'teal',
        createdAt: stamp(-12),
        members: { create: users.map(u => ({ userId: u.id })) },
      },
    }),
    prisma.project.create({
      data: {
        id: 'mobile-app-v2',
        name: 'Mobile App v2',
        description: 'A faster, more intuitive mobile experience',
        color: 'indigo',
        createdAt: stamp(-10),
        members: { create: users.map(u => ({ userId: u.id })) },
      },
    }),
  ])

  // Seed task definitions (matching the original seed data exactly)
  type SeedTask = { title: string; assigneeId: string; priority: string; due: number; moves: [number, string][]; description: string }
  const definitions: SeedTask[] = [
    { title: 'Define project scope', assigneeId: 'u1', priority: 'high', due: -6, moves: [[-8, 'in_progress'], [-7, 'review'], [-6, 'done']], description: 'Align the team on goals, deliverables, milestones, and the launch criteria.' },
    { title: 'Design homepage mockup', assigneeId: 'u3', priority: 'high', due: 2, moves: [[-6, 'in_progress'], [-1, 'review']], description: 'Create responsive homepage mockups and prepare the designs for team review.' },
    { title: 'Set up backend repository', assigneeId: 'u2', priority: 'normal', due: -4, moves: [[-7, 'in_progress'], [-4, 'review'], [-3, 'done']], description: 'Initialize the repository, development tooling, and contribution guidelines.' },
    { title: 'Build login flow', assigneeId: 'u2', priority: 'urgent', due: 1, moves: [[-2, 'in_progress']], description: 'Implement the sign-in screens, validation states, and session handoff.' },
    { title: 'Create style guide', assigneeId: 'u3', priority: 'normal', due: 4, moves: [[-3, 'in_progress']], description: 'Document typography, color tokens, and reusable interface components.' },
    { title: 'Write API documentation', assigneeId: 'u1', priority: 'normal', due: 7, moves: [], description: 'Describe the endpoints, request shapes, response contracts, and errors.' },
    { title: 'Fix payment bug', assigneeId: 'u2', priority: 'urgent', due: -4, moves: [[-5, 'in_progress']], description: 'Investigate the duplicate submission issue in checkout and add regression coverage.' },
    { title: 'Prepare user testing plan', assigneeId: 'u3', priority: 'high', due: 10, moves: [], description: 'Define usability tasks, participant criteria, and a feedback collection template.' },
    { title: 'Audit mobile navigation', assigneeId: 'u3', priority: 'high', due: 3, moves: [[-2, 'in_progress']], description: 'Review navigation patterns and document improvements for the next release.' },
    { title: 'Define offline requirements', assigneeId: 'u1', priority: 'normal', due: 6, moves: [], description: 'Identify the core workflows that should remain available without a connection.' },
    { title: 'Set up app development environment', assigneeId: 'u2', priority: 'normal', due: 8, moves: [], description: 'Prepare the mobile build pipeline and development environment.' },
  ]

  // Create tasks FIRST, then events
  for (let i = 0; i < definitions.length; i++) {
    const def = definitions[i]
    const projectId = i < 8 ? 'website-revamp' : 'mobile-app-v2'
    const createdAt = stamp(i < 8 ? -9 : -7)
    const history: [string, string][] = [[createdAt, 'backlog'], ...def.moves.map(([offset, status]) => [stamp(offset), status] as [string, string])]

    const [movedAt, status] = history[history.length - 1]
    await prisma.task.create({
      data: {
        id: `t${i + 1}`,
        key: `HL-${i + 1}`,
        projectId,
        title: def.title,
        description: def.description,
        assigneeId: def.assigneeId,
        priority: def.priority,
        status,
        dueDate: format(day(def.due), 'yyyy-MM-dd'),
        createdAt,
        movedAt,
        completedAt: status === 'done' ? movedAt : null,
      },
    })
  }

  // Create events after all tasks exist
  for (let i = 0; i < definitions.length; i++) {
    const def = definitions[i]
    const projectId = i < 8 ? 'website-revamp' : 'mobile-app-v2'
    const createdAt = stamp(i < 8 ? -9 : -7)
    const history: [string, string][] = [[createdAt, 'backlog'], ...def.moves.map(([offset, status]) => [stamp(offset), status] as [string, string])]

    for (let j = 0; j < history.length; j++) {
      const [eventCreatedAt, toStatus] = history[j]
      await prisma.taskEvent.create({
        data: {
          id: `t${i + 1}-e${j}`,
          taskId: `t${i + 1}`,
          projectId,
          userId: def.assigneeId,
          fromStatus: j === 0 ? null : history[j - 1][1],
          toStatus,
          createdAt: eventCreatedAt,
        },
      })
    }
  }

  // Create comments
  await Promise.all([
    prisma.comment.create({ data: { id: 'c1', taskId: 't4', authorId: 'u1', body: 'Please include the error and loading states in this pass.', createdAt: subHours(now, 26).toISOString() } }),
    prisma.comment.create({ data: { id: 'c2', taskId: 't4', authorId: 'u2', body: 'The main flow is ready. Working through validation and keyboard navigation now.', createdAt: subHours(now, 3).toISOString() } }),
    prisma.comment.create({ data: { id: 'c3', taskId: 't4', authorId: 'u3', body: 'Updated the form states in the design file for reference.', createdAt: subMinutes(now, 40).toISOString() } }),
    prisma.comment.create({ data: { id: 'c4', taskId: 't7', authorId: 'u1', body: 'This is blocking the release. Can you share an update on the root cause?', createdAt: subHours(now, 5).toISOString() } }),
    prisma.comment.create({ data: { id: 'c5', taskId: 't7', authorId: 'u2', body: 'Reproduced the double-submit issue. Adding a guard and a regression test.', createdAt: subMinutes(now, 15).toISOString() } }),
  ])

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })