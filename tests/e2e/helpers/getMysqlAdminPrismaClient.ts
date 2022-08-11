import { PrismaClient } from '@prisma/client'
import { PrismaClientOptions } from '@prisma/client/runtime'

export type PrismaClientConstructor = new (options: PrismaClientOptions) => PrismaClient

export async function GetMysqlAdminPrismaClient(
  databaseUrlBase: string,
  CtxPrismaClient: PrismaClientConstructor
): Promise<PrismaClient> {
  return new CtxPrismaClient({
    datasources: {
      db: {
        url: `${databaseUrlBase}/mysql`,
      },
    },
  })
}
