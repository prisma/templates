import { DBTestParams } from '~/tests/e2e/__testers__'
import { GetMysqlAdminPrismaClient } from '~/tests/e2e/helpers/getMysqlAdminPrismaClient'

export function getDefaultVitessTestConfig(): Omit<
  DBTestParams,
  'templateName' | 'testName' | 'expectedDevOutput'
> {
  return {
    datasourceProvider: 'mysql',
    getPrismaAdmin: GetMysqlAdminPrismaClient,
    prismaConfig: {
      referentialIntegrity: 'prisma',
    },
  }
}
