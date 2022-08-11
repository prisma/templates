import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const main = async () => {
  const reservations = await prisma.reservation.findMany({
    where: {
      price: {
        gte: 300,
      },
    },
  })

  console.log('Expensive reservations: ', reservations)
}

main()
  .catch((e) => console.error('Error in Prisma Client query: ', e))
  .finally(async () => await prisma.$disconnect())
