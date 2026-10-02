import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfillLeaders() {
  console.log('🔄 Starting backfill: promoting earliest member of each project to leader...')

  try {
    // Get all projects
    const projects = await prisma.project.findMany({
      include: {
        members: {
          orderBy: {
            id: 'asc' // Earliest added member by ID
          },
          take: 1
        }
      }
    })

    console.log(`📊 Found ${projects.length} projects`)

    let promoted = 0
    let skipped = 0

    for (const project of projects) {
      if (project.members.length === 0) {
        console.log(`⚠️  Project "${project.name}" has no members, skipping`)
        skipped++
        continue
      }

      const earliestMember = project.members[0]

      // Update the earliest member to be a leader
      await prisma.projectMember.update({
        where: {
          id: earliestMember.id
        },
        data: {
          role: 'leader'
        }
      })

      console.log(`✅ Promoted user ${earliestMember.userId} to leader of project "${project.name}"`)
      promoted++
    }

    console.log(`\n📈 Backfill complete:`)
    console.log(`   - ${promoted} members promoted to leader`)
    console.log(`   - ${skipped} projects skipped (no members)`)

    // Verify results
    const leaders = await prisma.projectMember.findMany({
      where: { role: 'leader' },
      include: {
        project: { select: { name: true } },
        user: { select: { name: true, email: true } }
      }
    })

    console.log(`\n👥 Current leaders:`)
    for (const leader of leaders) {
      console.log(`   - ${leader.user.name} (${leader.user.email}) → ${leader.project.name}`)
    }

  } catch (error) {
    console.error('❌ Backfill failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

backfillLeaders()
