import { PrismaTemplates } from '../../src'
import { konn, providers } from 'konn'
import { values } from 'lodash'
import stripAnsi from 'strip-ansi'
import { ClientBase } from '@prisma-spectrum/reflector/dist-cjs/Client'
import { Reflector } from '@prisma-spectrum/reflector'
import { PrismaClient } from '@prisma/client'
import { log } from 'floggy'
import { casesHandled } from '~/src/utils'
import { PrismaClientOptions } from '@prisma/client/runtime'

export interface DBTestParams {
  templateName: PrismaTemplates.$Types.Template['_tag']
  expectedDevOutput: RegExp | string
  datasourceProvider: Reflector.Schema.DatasourceProviderNormalized
  templateConfig?: Pick<PrismaTemplates.$Types.BaseTemplateParameters, 'referentialIntegrity'>
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
    case 'cockroachdb':
    case 'mongodb':
    case 'sqlserver':
    case 'sqlite':
      throw new Error(`Testing with ${datasourceProvider} not supported yet.`)
    default:
      casesHandled(datasourceProvider)
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
        await prismaClient.$executeRawUnsafe(`create database ${databaseName}`)
      } catch (e) {
        log.info(`Error initialising DB ${databaseName}`)
      }
      return
    case 'mysql':
      return prismaClient.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS ${databaseName}`)
    case 'cockroachdb':
    case 'mongodb':
    case 'sqlserver':
    case 'sqlite':
      throw new Error(`Testing with ${datasourceProvider} not supported yet.`)
    default:
      throw new Error(`Case not handled for ${datasourceProvider}`)
  }
}

export function getConnectionStringBase(
  dataSourceProvider: Reflector.Schema.DatasourceProviderNormalized
): string {
  switch (dataSourceProvider) {
    case 'postgres':
      return 'postgres://prisma:prisma@localhost:5401'
    case 'mysql':
      return 'mysql://prisma:prisma@localhost:33577'
    case 'cockroachdb':
    case 'mongodb':
    case 'sqlserver':
    case 'sqlite':
      throw new Error(`Testing with ${dataSourceProvider} not supported yet.`)
    default:
      throw new Error(`Case not handled for ${dataSourceProvider}`)
  }
}

export async function getAdminPrismaClient(
  databaseUrlBase: string,
  CtxPrismaClient: new (options: PrismaClientOptions) => PrismaClient,
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
      const connectionStringBase = getConnectionStringBase(params.datasourceProvider)
      const datasourceProvider = params.datasourceProvider
      const Template = PrismaTemplates.Templates[params.templateName]
      const template = new Template({
        dataproxy: false,
        datasourceProvider,
        repositoryOwner: 'prisma',
        repositoryHandle: `templates-node-test-${Template.metadata.handles.kebab}`,
        referentialIntegrity: params.templateConfig?.referentialIntegrity,
      })

      const databaseUrlBase = connectionStringBase
      const databaseName = template.metadata.handles.snake
      const databaseUrl = `${databaseUrlBase}/${databaseName}`

      const getPrismaClientModule = () => import(`${ctx.fs.cwd()}/node_modules/@prisma/client`)

      const getApplicationPrisma = async () =>
        new (await getPrismaClientModule()).PrismaClient({
          datasources: {
            db: {
              url: databaseUrl,
            },
          },
        }) as ClientBase

      const getAdminPrisma = async () => {
        return getAdminPrismaClient(
          databaseUrlBase,
          (await getPrismaClientModule()).PrismaClient,
          datasourceProvider
        )
      }

      const dropTestDatabase = async () => {
        return dropDatabase(await getAdminPrisma(), databaseName, datasourceProvider)
      }

      const createTestDatabase = async () => {
        return createDatabase(await getAdminPrisma(), databaseName, datasourceProvider)
      }

      return {
        getApplicationPrisma,
        getAdminPrisma,
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
  })

  /**
   * Test 2
   * Check that the template migration script works.
   */
  if (params.templateName !== 'Empty') {
    it(`${params.templateName} - template migration script should work`, async () => {
      await ctx.dropTestDatabase()
      await ctx.createTestDatabase()

      const prisma = await ctx.getApplicationPrisma()
      await Reflector.Client.runMigrationScript(
        prisma,
        ctx.template.migrationScript,
        params.datasourceProvider
      )
    })
  }
  /**
   * Test 3
   * Check the seed again but this time using the derived seed function.
   */
  if (params.templateName !== 'Empty') {
    it.skip(`${params.templateName} - seed using the derived seed function should work`, async () => {
      const prisma = await ctx.getApplicationPrisma()
      // TODO improve seed scripts to return reports that we can use to capture feedback here not to mention for users generally.
      await ctx.template.seed({ prisma })
    })
  }

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

    // TODO Test the Vercel API (next dev for Blog template)
    // await ctx.fs.writeAsync('.vercel/project.json', {
    //   projectId: 'prj_6yrTe9CGQagAQwGjr7JEejkxhz3A',
    //   orgId: 'team_ASKXQ5Yc1an2RqJc5BCI9rGw',
    // })
  })
}
