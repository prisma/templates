import { NextApiHandler } from 'next'
import { prisma } from '../../lib/prisma'

const handler: NextApiHandler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const users = await prisma.post.findMany({
        include: { author: true },
      })
      res.status(200).json(users)
    } catch (error) {
      console.error(error)
      res.status(500).json(error)
    }
  } else if (req.method === 'POST') {
    const { title, content, authorEmail } = req.body
    try {
      const createdPost = await prisma.post.create({
        data: {
          title,
          content,
          author: {
            connect: {
              email: authorEmail,
            },
          },
        },
      })

      res.status(200).json(createdPost)
      return
    } catch (e) {
      console.error(e)

      res.status(500)
      return
    }
  } else {
    res.status(404)
  }
}

export default handler
