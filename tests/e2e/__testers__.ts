import { PrismaTemplates } from '../../src'
import { konn, providers } from 'konn'
import { values } from 'lodash'
import stripAnsi from 'strip-ansi'
import { ClientBase } from '@prisma-spectrum/reflector/dist-cjs/Client'
import { Reflector } from '@prisma-spectrum/reflector'
import { PrismaClient } from '@prisma/client'
import { log } from 'floggy'
import { PrismaClientConstructor } from '~/tests/e2e/helpers/getMysqlAdminPrismaClient'

export interface DBTestParams {
  templateName: PrismaTemplates.$Types.Template['_tag']
  expectedDevOutput: RegExp | string
  datasourceProvider: Reflector.Schema.DatasourceProviderNormalized
  prismaConfig?: {
    referentialIntegrity?: 'prisma' | 'foreignKeys'
  }
}

async function dropDatabase(
  prismaClient: PrismaClient,
  databaseName: string,
  datasourceProvider: Reflector.Schema.DatasourceProviderNormalized
) {
  switch (datasourceProvider) {
    case 'postgres':
      try {
        await prismaClient.$executeRawUnsafe(`DROP DATABASE ${databaseName} WITH (FORCE);`)
      } catch (error) {
        const isDatabaseNotFoundErorr = error instanceof Error && error.message.match(/does not exist/)
        if (!isDatabaseNotFoundErorr) throw error
      }
      return
    case 'mysql':
      try {
        await prismaClient.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${databaseName};`)
      } catch (error) {
        const isDatabaseNotFoundErorr = error instanceof Error && error.message.match(/database not found/)
        if (!isDatabaseNotFoundErorr) throw error
      }
      return
    default:
      throw new Error(`Case not handled for ${datasourceProvider}`)
  }
}

async function createDatabase(
  prismaClient: PrismaClient,
  databaseName: string,
  datasourceProvider: Reflector.Schema.DatasourceProviderNormalized
) {
  switch (datasourceProvider) {
    case 'postgres':
      try {
        prismaClient.$executeRawUnsafe(`create database ${databaseName}`)
      } catch (e) {
        log.info(`Error initialising DB ${databaseName}`)
      }
      return
    case 'mysql':
      return await prismaClient.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS ${databaseName}`)
    default:
      throw new Error(`Case not handled for ${datasourceProvider}`)
  }
}

export function getConnectionString(
  dataSourceProvider: Reflector.Schema.DatasourceProviderNormalized
): string {
  switch (dataSourceProvider) {
    case 'postgres':
      return 'postgres://prisma:prisma@localhost:5401'
    case 'mysql':
      return 'mysql://root:root@localhost:33577'
    default:
      throw new Error(`Case not handled for ${dataSourceProvider}`)
  }
}

export async function getAdminPrismaClient(
  databaseUrlBase: string,
  CtxPrismaClient: PrismaClientConstructor,
  dataSourceProvider: Reflector.Schema.DatasourceProviderNormalized
): Promise<PrismaClient> {
  switch (dataSourceProvider) {
    case 'postgres':
      return new CtxPrismaClient({
        datasources: {
          db: {
            url: `${databaseUrlBase}/postgres`,
          },
        },
      }) as ClientBase
    case 'mysql':
      return new CtxPrismaClient({
        datasources: {
          db: {
            url: `${databaseUrlBase}/mysql`,
          },
        },
      })
    default:
      throw new Error(`Case not handled for ${dataSourceProvider}`)
  }
}

export const testTemplate = (params: DBTestParams) => {
  jest.setTimeout(100_000)

  const ctx = konn()
    .useBeforeAll(providers.dir())
    .useBeforeAll(providers.run())
    .beforeAll(async (ctx) => {
      const connectionStringBase = getConnectionString(params.datasourceProvider)
      const datasourceProvider = params.datasourceProvider
      const Template = PrismaTemplates.Templates[params.templateName]
      const template = new Template({
        dataproxy: false,
        datasourceProvider,
        repositoryOwner: 'prisma',
        repositoryHandle: `templates-node-test-${Template.metadata.handles.kebab}`,
        referentialIntegrity: params.prismaConfig?.referentialIntegrity,
      })

      const databaseUrlBase = connectionStringBase
      const databaseName = template.metadata.handles.snake
      const databaseUrl = `${databaseUrlBase}/${databaseName}`

      const getPrismaClientModule = () => import(`${ctx.fs.cwd()}/node_modules/@prisma/client`)

      const getPrisma = async () =>
        new (await getPrismaClientModule()).PrismaClient({
          datasources: {
            db: {
              url: databaseUrl,
            },
          },
        }) as ClientBase

      const getPrismaAdmin = async () => {
        return getAdminPrismaClient(
          databaseUrlBase,
          (await getPrismaClientModule()).PrismaClient,
          datasourceProvider
        )
      }

      const dropTestDatabase = async () => {
        return dropDatabase(await getPrismaAdmin(), databaseName, datasourceProvider)
      }

      const createTestDatabase = async () => {
        return createDatabase(await getPrismaAdmin(), databaseName, datasourceProvider)
      }

      return {
        getPrisma,
        getPrismaAdmin,
        template,
        dropTestDatabase,
        createTestDatabase,
        databaseName,
        databaseUrl,
      }
    })
    .afterAll(async (ctx) => {
      if (params.templateName !== 'Empty') {
        await ctx.dropTestDatabase?.()
      }
    })
    .done()

  /**
   * Test 1
   * Check that the initialization script works. This includes running migrate triggering generators and executing the seed.
   */
  it(`${params.templateName} - init script should work`, async () => {
    if (!process.env.CI) console.log(ctx.fs.cwd())

    console.log(`Starting the test ${params.templateName} for DB ${params.datasourceProvider}`)
    /**
     * Setup the project. Write files to disk, install deps, etc.
     */
    await ctx.fs.writeAsync(`.npmrc`, `scripts-prepend-node-path=true`)
    await Promise.all(values(ctx.template.files).map((file) => ctx.fs.writeAsync(file.path, file.content)))
    ctx.run(`npm install`)
    await ctx.fs.writeAsync('.env', `DATABASE_URL='${ctx.databaseUrl}'`)

    console.log('Writing to .env file and .npmrc')
    /**
     * Exit early for empty template as there is nothing more to test.
     */
    if (ctx.template._tag === 'Empty') return

    /**
     * Drop database before running the tests case it wasn't cleaned up from the previous test run.
     */

    await ctx.dropTestDatabase()
    await ctx.createTestDatabase()

    const initResult = await ctx.runAsync(`npm run init`, { reject: true })

    expect(initResult.stderr).toMatch('')
    expect(stripAnsi(initResult.stdout)).toMatch('Generated Prisma Client')
    expect(stripAnsi(initResult.stdout)).toMatch('Running seed command')

    // TODO Test the Vercel API (next dev for Blog template)
    // await ctx.fs.writeAsync('.vercel/project.json', {
    //   projectId: 'prj_6yrTe9CGQagAQwGjr7JEejkxhz3A',
    //   orgId: 'team_ASKXQ5Yc1an2RqJc5BCI9rGw',
    // })
  })

  /**
   * Test 2
   * Check that the template migration script works.
   */
  it(`${params.templateName} - template migration script should work`, async () => {
    if (ctx.template._tag === 'Empty') return

    await ctx.dropTestDatabase()
    await ctx.createTestDatabase()

    console.log('Get getPrisma()')
    const prisma = await ctx.getPrisma()
    await Reflector.Client.runMigrationScript(prisma, ctx.template.migrationScript, params.datasourceProvider)
  })

  /**
   * Test 3
   * Check the seed again but this time using the derived seed function.
   */
  it.skip(`${params.templateName} - seed using the derived seed function should work`, async () => {
    if (ctx.template._tag === 'Empty') return

    const prisma = await ctx.getPrisma()
    // TODO improve seed scripts to return reports that we can use to capture feedback here not to mention for users generally.
    await ctx.template.seed({ prisma })
  })

  /**
   * Test 4
   * Check the development project script. For most templates this will run some kind of sandbox script against the database.
   *
   * The Nextjs template launches next dev for its dev script and thus is exempt from this test.
   */
  it(`${params.templateName} - development project script should work`, async () => {
    if (ctx.template._tag !== 'Nextjs') {
      const devResult = ctx.run(`npm run dev`, { reject: true })
      expect(devResult.stderr).toMatch('')
      expect(devResult.stdout).toMatch(params.expectedDevOutput)
    }
  })
}
