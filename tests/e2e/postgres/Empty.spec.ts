import { testTemplate } from '~/tests/e2e/__testers__'
import { GetPostgresAdminPrismaClient } from '~/tests/e2e/helpers/getPostgresAdminPrismaClient'

testTemplate({
  templateName: 'Empty',
  expectedDevOutput: '',
  getPrismaAdmin: GetPostgresAdminPrismaClient,
  connectionStringBase: 'postgres://prisma:prisma@localhost:5401',
  datasourceProvider: 'postgres',
})
