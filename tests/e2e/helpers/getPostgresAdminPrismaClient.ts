import { ClientBase } from '@prisma-spectrum/reflector/dist-cjs/Client'
import { PrismaClient } from '@prisma/client'
import { PrismaClientConstructor } from '~/tests/e2e/helpers/getMysqlAdminPrismaClient'

export type getPrismaClient = (
  databaseUrlBase: string,
  CtxPrismaClient: PrismaClientConstructor
) => Promise<PrismaClient>

export async function GetPostgresAdminPrismaClient(
  databaseUrlBase: string,
  CtxPrismaClient: PrismaClientConstructor
): Promise<PrismaClient> {
  return new CtxPrismaClient({
    datasources: {
      db: {
        url: `${databaseUrlBase}/postgres`,
      },
    },
  }) as ClientBase
}
