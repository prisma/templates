import { testTemplate } from '../__testers__'
import { GetPostgresAdminPrismaClient } from '~/tests/e2e/helpers/getPostgresAdminPrismaClient'
import { dropPostgresDatabase } from '~/tests/e2e/helpers/dropPostgresDatabase'

testTemplate({
  templateName: 'Empty',
  expectedDevOutput: '',
  getPrismaAdmin: GetPostgresAdminPrismaClient,
  databaseUrlBase: 'postgres://prisma:prisma@localhost:5401',
  dbLifeCycleEvents: {
    resetDatabase: dropPostgresDatabase,
    initDatabase: async () => {},
  },
})
