import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Query actual row counts from MySQL
    const userCount = await prisma.user.count()
    const projectCount = await prisma.project.count()
    const taskCount = await prisma.task.count()
    const commentCount = await prisma.comment.count()
    const eventCount = await prisma.taskEvent.count()
    const memberCount = await prisma.projectMember.count()

    console.log('=== DATABASE ROW COUNTS (Direct Prisma Query) ===\n')
    console.log(`Users:          ${userCount}`)
    console.log(`Projects:       ${projectCount}`)
    console.log(`Tasks:          ${taskCount}`)
    console.log(`Comments:       ${commentCount}`)
    console.log(`Task Events:    ${eventCount}`)
    console.log(`Project Members: ${memberCount}`)

    console.log('\n=== SAMPLE TASKS FROM DATABASE ===\n')
    const tasks = await prisma.task.findMany({ take: 3 })
    tasks.forEach((task, i) => {
      console.log(`Task ${i + 1}:`)
      console.log(`  ID: ${task.id}`)
      console.log(`  Key: ${task.key}`)
      console.log(`  Title: ${task.title}`)
      console.log(`  Status: ${task.status}`)
      console.log(`  Project ID: ${task.projectId}`)
      console.log()
    })

    console.log('=== SAMPLE USERS FROM DATABASE ===\n')
    const users = await prisma.user.findMany()
    users.forEach((user, i) => {
      console.log(`User ${i + 1}: ${user.name} (${user.id}) - ${user.role}`)
    })

    console.log('\n✅ Data confirmed in MySQL at: mysql-mydatabases-jaiswalshivam95085-179f.h.aivencloud.com:28768/tracker_db')

  } catch (error) {
    console.error('❌ Database query failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
