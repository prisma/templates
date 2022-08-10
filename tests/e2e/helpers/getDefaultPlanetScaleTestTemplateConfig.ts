import { DBTestParams } from '~/tests/e2e/__testers__'
import { GetMysqlAdminPrismaClient } from '~/tests/e2e/helpers/getMysqlAdminPrismaClient'

export function getDefaultPlanetScaleTestTemplateConfig(
  dbURI: string
): Omit<DBTestParams, 'templateName' | 'testName' | 'expectedDevOutput'> {
  return {
    databaseUrlBase: dbURI,
    datasourceProvider: 'mysql',
    getPrismaAdmin: GetMysqlAdminPrismaClient,
    databaseActions: {
      resetDatabase: async () => {},
      initDatabase: async () => {},
    },
    prismaConfig: {
      referentialIntegrity: 'prisma',
    },
  }
}
