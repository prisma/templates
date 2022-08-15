import { PrismaClient } from '@prisma/client'
import faker from 'faker'

const prisma = new PrismaClient()

const NUMBER_OF_USERS = 10
const NUMBER_OF_ROOMS = 20

const roomIds = Array.from({
  length: NUMBER_OF_ROOMS,
}).map(() => faker.datatype.uuid())

const rooms = Array.from({
  length: NUMBER_OF_ROOMS,
}).map((_, i) => ({
  id: roomIds[i],
  price: faker.datatype.number({
    min: 50,
    max: 600,
  }),
  // random address - example: b-365
  address: `${faker.address.streetPrefix()}-${faker.datatype.number({
    min: 300,
    max: 1,
  })}`,
  totalOccupancy: faker.datatype.number({ min: 1, max: 5 }),
  totalBedrooms: faker.datatype.number({ min: 1, max: 5 }),
  totalBathrooms: faker.datatype.number({ min: 1, max: 5 }),
  summary: faker.lorem.paragraph(),
  media: Array.from({
    length: faker.datatype.number({ min: 1, max: 5 }),
  }).map(() => ({
    fileName: faker.image.imageUrl(),
  })),
}))

const data = Array.from({ length: NUMBER_OF_USERS }).map(() => ({
  email: faker.internet.email(),
  name: faker.name.firstName(),
  reviews: Array.from({
    length: faker.datatype.number({
      max: 1,
      min: 4,
    }),
  }).map(() => ({
    comment: faker.lorem.paragraph(),
    rating: faker.datatype.number({
      max: 1,
      min: 5,
    }),
  })),
  // create random reservations per user
  reservations: Array.from({
    length: faker.datatype.number({
      min: 1,
      max: 4,
    }),
  }).map(() => {
    const startDate = faker.date.past()
    const endDate = faker.date.future()
    const price = faker.datatype.number({
      min: 50,
      max: 600,
    })
    return {
      startDate,
      endDate,
      price,
      total: Math.ceil(Math.abs(+endDate - +startDate) / (1000 * 60 * 60 * 24)) * price, // difference between dates * price
      room: {
        connect: {
          id: roomIds[
            faker.datatype.number({
              min: 0,
              max: NUMBER_OF_ROOMS - 1,
            })
          ],
        },
      },
    }
  }),
}))

async function main() {
  await prisma.$transaction(
    rooms.map((room) =>
      prisma.room.create({
        data: {
          id: room.id,
          address: room.address,
          price: room.price,
          summary: room.summary,
          media: {
            create: room.media,
          },
        },
      })
    )
  )

  await prisma.$transaction(
    data.map((entry) =>
      prisma.user.create({
        data: {
          email: entry.email,
          name: entry.name,
          reservations: {
            create: entry.reservations,
          },
          reviews: {
            create: entry.reviews,
          },
        },
      })
    )
  )
}

main().finally(async () => {
  await prisma.$disconnect()
})
