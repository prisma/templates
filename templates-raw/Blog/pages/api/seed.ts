import { Prisma } from '@prisma/client'
import { NextApiHandler } from 'next'
import { prisma } from '../../lib/prisma'

const handler: NextApiHandler = async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.profile.deleteMany({}),
      prisma.post.deleteMany({}),
      prisma.user.deleteMany({}),
    ])

    const createdUsers = await prisma.$transaction([
      prisma.user.create({
        data: seedUsers[0],
      }),
      prisma.user.create({
        data: seedUsers[1],
      }),
    ])

    res.status(201).json(createdUsers)
  } catch (error) {
    console.error(error)
    res.status(500).end()
  }
}

const seedUsers: Prisma.UserCreateInput[] = [
  {
    email: 'jane@prisma.io',
    name: 'Jane',
    profiles: {
      create: [
        {
          bio: 'Technical Writer',
        },
        {
          bio: 'Health Enthusiast',
        },
        {
          bio: 'Self Quantifier',
        },
      ],
    },
    posts: {
      create: [
        {
          title: 'Comparing Database Types: How Database Types Evolved to Meet Different Needs',
          content: 'https://www.prisma.io/blog/comparison-of-database-models-1iz9u29nwn37/',
        },
        {
          title: 'Analysing Sleep Patterns: The Quantified Self',
          content: 'https://quantifiedself.com/get-started/',
        },
      ],
    },
  },
  {
    email: 'toru@prisma.io',
    name: 'Toru Takemitsu',
    profiles: {
      create: [
        {
          bio: 'Composer',
        },
        {
          bio: 'Musician',
        },
        {
          bio: 'Writer',
        },
      ],
    },
    posts: {
      create: [
        {
          title: 'Requiem for String Orchestra',
          content: '',
        },
        {
          title: 'Music of Tree',
          content: '',
        },
        {
          title: 'Waves for clarinet, horn, two trombones and bass drum ',
          content: '',
        },
      ],
    },
  },
]

export default handler
