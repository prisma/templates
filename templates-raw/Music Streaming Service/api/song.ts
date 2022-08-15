import { PrismaClient, Prisma } from '@prisma/client'
import { VercelRequest, VercelResponse } from '@vercel/node'

type VercelRequestQuery = {
  id?: string
}

export default async function (req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query as VercelRequestQuery
    const prisma = new PrismaClient()

    console.log(
      '[song] Incoming request:',
      JSON.stringify(
        {
          method: req.method,
          query: req.query,
          body: req.body,
        },
        null,
        2
      )
    )

    switch (req.method) {
      case 'GET':
        return res.json(
          await prisma.song.findMany({
            where: { id },
          })
        )
      case 'POST':
        return res.json(
          await prisma.song.create({
            data: req.body as Prisma.SongCreateInput,
          })
        )
      case 'PUT':
        return res.json(
          await prisma.song.update({
            where: {
              id,
            },
            data: req.body as Prisma.SongUpdateInput,
          })
        )
      case 'DELETE':
        return res.json(
          await prisma.song.delete({
            where: { id },
          })
        )
    }

    return res.status(400).send({ message: `Unexpected request method: ${req.method}` })
  } catch (e: any) {
    console.error('[song] Error responding:', e)
    return res.status(500).json({ message: e?.message || e })
  }
}
