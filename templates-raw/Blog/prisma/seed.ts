import { Prisma, PrismaClient } from '@prisma/client'
import faker from 'faker'

const prisma = new PrismaClient()

const NUMBER_OF_USERS = 10
const MAX_POSTS = 10
const MAX_PROFILES = 2

const users: Prisma.UserCreateInput[] = Array.from({
  length: NUMBER_OF_USERS,
}).map((_, i) => ({
  email: faker.internet.email(),
  name: faker.name.firstName(),
  posts: {
    createMany: {
      data: Array.from({
        length: faker.datatype.number({ min: 0, max: MAX_POSTS }),
      }).map(() => ({
        content: faker.lorem.paragraphs(),
        title: faker.lorem.words(),
      })),
    },
  },
  profiles: {
    createMany: {
      data: Array.from({
        length: faker.datatype.number({ min: 1, max: MAX_PROFILES }),
      }).map(() => ({
        bio: faker.lorem.paragraph(),
      })),
    },
  },
}))

async function main() {
  await prisma.$transaction(
    users.map((user) =>
      prisma.user.create({
        data: user,
      })
    )
  )
}

main().finally(async () => {
  await prisma.$disconnect()
})
