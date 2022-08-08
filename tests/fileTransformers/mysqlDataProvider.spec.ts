import { PrismaTemplates } from '~/src'
import { mysqlSchemaTypeTransformer } from '~/src/fileTransformers/mysqlSchemaTypeTransformer'
import { Params } from '~/src/fileTransformer/fileTransformer'

describe('mysqlSchemaTypeTransformer', function () {
  const Template = PrismaTemplates.Templates['RentalsPlatform']
  const template = new Template({
    dataproxy: false,
    datasourceProvider: 'postgres',
    repositoryOwner: 'prisma',
    repositoryHandle: `templates-node-test`,
  })
  test('should replace String with String @db.Text on every field in schema', () => {
    const file = {
      ...template.files['prisma/schema.prisma'],
      content: `generator client {
        provider = "prisma-client-js"
      }
      
      datasource db {
        provider = "mysql"
        url      = env("DATABASE_URL")
      }
      
      model User {
        id           String        @id @default(uuid())
        updatedAt    DateTime      @updatedAt
        email        String        @unique
        name         String?
        reviews      Review[]
      }`,
    }

    const expected = `generator client {
        provider = "prisma-client-js"
      }
      
      datasource db {
        provider = "mysql"
        url      = env("DATABASE_URL")
      }
      
      model User {
        id           String @db.Text        @id @default(uuid())
        updatedAt    DateTime      @updatedAt
        email        String @db.Text        @unique
        name         String? @db.Text
        reviews      Review[]
      }`

    const params: Params = {
      file,
      // not needed for tests
      // @ts-ignore
      parameters: {
        datasourceProvider: 'mysql',
      },
      template: template._tag,
      // not needed for tests
      // @ts-ignore
      tools: {},
    }
    const actual = mysqlSchemaTypeTransformer(params)

    expect(actual).toEqual(expected)
  })

  test('should convert String to @db.Text when simple schema is provided ', () => {
    const file = {
      ...template.files['prisma/schema.prisma'],
      content: `a String b String? c DateTime`,
    }

    const expected = `a String @db.Text b String? @db.Text c DateTime`

    const params: Params = {
      file,
      // not needed for tests
      // @ts-ignore
      parameters: {
        datasourceProvider: 'mysql',
      },
      template: template._tag,
      // not needed for tests
      // @ts-ignore
      tools: {},
    }
    const actual = mysqlSchemaTypeTransformer(params)

    expect(actual).toEqual(expected)
  })
})
