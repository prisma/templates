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
        console.log(`Dropping database ${databaseName}`)
        try {
          await prismaClient.$executeRawUnsafe(`DROP DATABASE ${databaseName};`)
        } catch (error) {
          const isDatabaseNotFoundErorr = error instanceof Error && error.message.match(/No database found/)
          if (!isDatabaseNotFoundErorr) throw error
        }
      },
      initDatabase: async () => {
        //
      },
    },
    prismaConfig: {
      referentialIntegrity: 'prisma',
    },
  }
}
