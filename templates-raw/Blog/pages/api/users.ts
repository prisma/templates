import { Prisma } from '@prisma/client'
import { NextApiHandler } from 'next'
import { prisma } from '../../lib/prisma'

const handler: NextApiHandler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        include: { profiles: true },
      })

      res.status(200).json(users)
    } catch (error) {
      console.error(error)

      res.status(500).json(error)
      return
    }
  } else if (req.method === 'POST') {
    try {
      const createdUser = await prisma.user.create({
        data: req.body,
      })

      res.status(200).json(createdUser)
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          res.status(409).json({ error: 'A user with this email already exists' })
          return
        }
      }

      console.error(e)
      res.status(500)
      return
    }
  } else {
    res.status(404)
    return
  }
}

export default handler
