import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const main = async () => {
  const accounts = await prisma.account.findMany({
    where: {
      isActive: true,
    },
  })

  console.log('Premium accounts: ', accounts)
}

main()
  .catch((e) => console.error('Error in Prisma Client query: ', e))
  .finally(async () => await prisma.$disconnect())
