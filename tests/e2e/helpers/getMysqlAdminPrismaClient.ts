import { PrismaClientConstructor } from '~/tests/e2e/helpers/getPrismaClientModule'
import { PrismaClient } from '@prisma/client'

export async function GetMysqlAdminPrismaClient(
  databaseUrlBase: string,
  CtxPrismaClient: PrismaClientConstructor
): Promise<PrismaClient> {
  return new CtxPrismaClient({
    datasources: {
      db: {
        url: `${databaseUrlBase}/test`,
      },
    },
  })
}
