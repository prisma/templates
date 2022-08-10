import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const main = async () => {
  const albums = await prisma.album.findMany({
    where: {
      name: {
        contains: ' ',
      },
    },
  })

  console.log('Albums that have more than 1 word: ', albums)
}

main()
  .catch((e) => console.error('Error in Prisma Client query: ', e))
  .finally(async () => await prisma.$disconnect())
