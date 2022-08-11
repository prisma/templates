import { DBTestParams } from '~/tests/e2e/__testers__'

export function getDefaultVitessTestConfig(): Omit<
  DBTestParams,
  'templateName' | 'testName' | 'expectedDevOutput'
> {
  return {
    datasourceProvider: 'mysql',
    prismaConfig: {
      referentialIntegrity: 'prisma',
    },
  }
}
