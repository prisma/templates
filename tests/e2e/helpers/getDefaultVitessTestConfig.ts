import { DBTestParams } from '~/tests/e2e/__testers__'
import { GetMysqlAdminPrismaClient } from '~/tests/e2e/helpers/getMysqlAdminPrismaClient'

export function getDefaultVitessTestConfig(
  dbURI: string
): Omit<DBTestParams, 'templateName' | 'testName' | 'expectedDevOutput'> {
  return {
    connectionStringBase: dbURI,
    datasourceProvider: 'mysql',
    getPrismaAdmin: GetMysqlAdminPrismaClient,
    databaseActions: {
      resetDatabase: async (prismaClient, databaseName) => {
        try {
          return await prismaClient.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${databaseName};`)
        } catch (error) {
          const isDatabaseNotFoundErorr = error instanceof Error && error.message.match(/database not found/)
          if (!isDatabaseNotFoundErorr) throw error
        }
      },
      initDatabase: async (prismaClient, databaseName) => {
        return await prismaClient.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS ${databaseName}`)
      },
    },
    prismaConfig: {
      referentialIntegrity: 'prisma',
    },
  }
}
