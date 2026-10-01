import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const demoPassword = 'hostlink123'
  const hashedPassword = await bcrypt.hash(demoPassword, 10)

  // Update the 3 existing demo users with hashed passwords
  await prisma.user.update({
    where: { id: 'u1' },
    data: { password: hashedPassword }
  })

  await prisma.user.update({
    where: { id: 'u2' },
    data: { password: hashedPassword }
  })

  await prisma.user.update({
    where: { id: 'u3' },
    data: { password: hashedPassword }
  })

  console.log('✅ Demo user passwords updated successfully!')
  console.log('Demo password: hostlink123')
  console.log('Demo users: asha@hostlink.demo, rohan@hostlink.demo, meera@hostlink.demo')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
