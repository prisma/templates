import { GetPostgresAdminPrismaClient } from '~/tests/e2e/helpers/getPostgresAdminPrismaClient'
import { DBTestParams } from '~/tests/e2e/__testers__'

export function getDefaultPostgresTestTemplateConfig(
  dbURI = 'postgres://prisma:prisma@localhost:5401'
): Omit<DBTestParams, 'templateName' | 'testName' | 'expectedDevOutput'> {
  return {
    getPrismaAdmin: GetPostgresAdminPrismaClient,
    datasourceProvider: 'postgres',
    connectionStringBase: dbURI,
  }
}
