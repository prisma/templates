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
      '[artist] Incoming request:',
      JSON.stringify(
        {
          method: req.method,
          query: req.query,
          body: req.body,
        },
        null,
        2,
      ),
    )

    switch (req.method) {
      case 'GET':
        return res.json(
          await prisma.artist.findMany({
            where: { id },
          }),
        )
      case 'POST':
        return res.json(
          await prisma.artist.create({
            data: req.body as Prisma.ArtistCreateInput,
          }),
        )
      case 'PUT':
        return res.json(
          await prisma.artist.update({
            where: {
              id,
            },
            data: req.body as Prisma.ArtistUpdateInput,
          }),
        )
      case 'DELETE':
        return res.json(
          await prisma.artist.delete({
            where: { id },
          }),
        )
    }

    return res
      .status(400)
      .send({ message: `Unexpected request method: ${req.method}` })
  } catch (e: any) {
    console.error('[artist] Error responding:', e)
    return res.status(500).json({ message: e?.message || e })
  }
}
