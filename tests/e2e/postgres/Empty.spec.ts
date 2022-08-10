import { testTemplate } from '../__testers__'
import { GetPostgresAdminPrismaClient } from '~/tests/e2e/helpers/getPostgresAdminPrismaClient'
import { dropPostgresDatabase } from '~/tests/e2e/helpers/dropPostgresDatabase'

testTemplate({
  templateName: 'Empty',
  expectedDevOutput: '',
  getPrismaAdmin: GetPostgresAdminPrismaClient,
  connectionStringBase: 'postgres://prisma:prisma@localhost:5401',
  datasourceProvider: 'postgres',
  databaseActions: {
    resetDatabase: dropPostgresDatabase,
    initDatabase: async () => {},
  },
})
