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
      '[media] Incoming request:',
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
          await prisma.media.findMany({
            where: { id },
          }),
        )
      case 'POST':
        return res.json(
          await prisma.media.create({
            data: req.body as Prisma.MediaCreateInput,
          }),
        )
      case 'PUT':
        return res.json(
          await prisma.media.update({
            where: {
              id,
            },
            data: req.body as Prisma.MediaUpdateInput,
          }),
        )
      case 'DELETE':
        return res.json(
          await prisma.media.delete({
            where: { id },
          }),
        )
    }

    return res
      .status(400)
      .send({ message: `Unexpected request method: ${req.method}` })
  } catch (e: any) {
    console.error('[media] Error responding:', e)
    return res.status(500).json({ message: e?.message || e })
  }
}
