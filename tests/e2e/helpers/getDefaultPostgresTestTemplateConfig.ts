import { GetPostgresAdminPrismaClient } from '~/tests/e2e/helpers/getPostgresAdminPrismaClient'
import { dropPostgresDatabase } from '~/tests/e2e/helpers/dropPostgresDatabase'
import { initPostgresDatabase } from '~/tests/e2e/helpers/initPostgresDatabase'
import { DBTestParams } from '~/tests/e2e/__testers__'

export function getDefaultPostgresTestTemplateConfig(
  dbURI = 'postgres://prisma:prisma@localhost:5401'
): Omit<DBTestParams, 'templateName' | 'testName' | 'expectedDevOutput'> {
  return {
    getPrismaAdmin: GetPostgresAdminPrismaClient,
    datasourceProvider: 'postgres',
    connectionStringBase: dbURI,
    databaseActions: {
      resetDatabase: dropPostgresDatabase,
      initDatabase: initPostgresDatabase,
    },
  }
}
