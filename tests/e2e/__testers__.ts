import { PrismaTemplates } from '../../src'
import { konn, providers } from 'konn'
import { values } from 'lodash'
import stripAnsi from 'strip-ansi'
import { ClientBase } from '@prisma-spectrum/reflector/dist-cjs/Client'
import { Reflector } from '@prisma-spectrum/reflector'
import { getPrismaClient } from '~/tests/e2e/helpers/getPostgresAdminPrismaClient'
import { PrismaClient } from '@prisma/client'

export interface DBTestParams {
  templateName: PrismaTemplates.$Types.Template['_tag']
  expectedDevOutput: RegExp | string
  testDBURI?: string
  datasourceProvider: Reflector.Schema.DatasourceProviderNormalized
  databaseUrlBase: string
  getPrismaAdmin: getPrismaClient
  databaseActions: {
    resetDatabase: (prismaClient: PrismaClient, databaseName: string) => Promise<void>
    initDatabase: (prismaClient: PrismaClient, databaseName: string) => Promise<void>
  }
  prismaConfig?: {
    referentialIntegrity?: 'prisma' | 'foreignKeys'
  }
}

export const testTemplate = (params: DBTestParams) => {
  jest.setTimeout(100_000)

  const ctx = konn()
    .useBeforeAll(providers.dir())
    .useBeforeAll(providers.run())
    .beforeAll(async (ctx) => {
      const datasourceProvider = params.datasourceProvider
      const Template = PrismaTemplates.Templates[params.templateName]
      const template = new Template({
        dataproxy: false,
        datasourceProvider,
        repositoryOwner: 'prisma',
        repositoryHandle: `templates-node-test-${Template.metadata.handles.kebab}`,
        referentialIntegrity: params.prismaConfig?.referentialIntegrity,
      })

      const databaseUrlBase = params.databaseUrlBase
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
        return params.getPrismaAdmin(databaseUrlBase, (await getPrismaClientModule()).PrismaClient)
      }

      const dropTestDatabase = async () => {
        return params.databaseActions.resetDatabase(await getPrismaAdmin(), databaseName)
      }

      const initTestDatabase = async () => {
        return params.databaseActions.initDatabase(await getPrismaAdmin(), databaseName)
      }

      return {
        getPrisma,
        getPrismaAdmin,
        template,
        dropTestDatabase,
        initTestDatabase,
        databaseName,
        databaseUrl,
      }
    })
    .afterAll(async (ctx) => {
      if (params.templateName !== 'Empty') {
        if (ctx.run) {
          await ctx.run(`prisma migrate reset --force`, { reject: true })
        }
        await ctx.dropTestDatabase?.()
      }
    })
    .done()

  it(`${params.templateName}`, async () => {
    // Useful log during development to manually explore/debug the test project.
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
     * Exit early for empty tempalte as there is nothing more to test.
     */
    if (ctx.template._tag === 'Empty') return

    /**
     * Drop database before running the tests case it wasn't cleaned up from the previous test run.
     */

    const comm = await ctx.run(`prisma migrate reset --force`, { reject: true })
    const comm2 = await ctx.run(`prisma generate`, { reject: true })
    console.log('two comm', { comm, comm2 })
    await ctx.dropTestDatabase()
    await ctx.initTestDatabase()
    console.log('database dropped from he previous run')

    await ctx.run(`prisma db push`, { reject: true })

    /**
     * Test 1
     * Check that the initialization script works. This includes running migrate triggering generators and executing the seed.
     */
    const initResult = await ctx.runAsync(`npm run init`, { reject: true })
    console.log('initResult.stdout', initResult.stdout)
    expect(initResult.stderr).toMatch('')
    expect(stripAnsi(initResult.stdout)).toMatch('Generated Prisma Client')
    expect(stripAnsi(initResult.stdout)).toMatch('Running seed command')

    console.log('Get getPrisma()')
    const prisma = await ctx.getPrisma()
    console.log('Get getPrismaAdmin()')

    const prismaAdmin = await ctx.getPrismaAdmin()

    try {
      /**
       * Test 2
       * Check that the template migration script works.
       */
      const comm = await ctx.run(`prisma migrate reset --force`, { reject: true })
      console.log('Second test reset finished..')
      console.log({ comm })
      await ctx.dropTestDatabase()
      await ctx.initTestDatabase()
      console.log('drop & init finished..')

      await Reflector.Client.runMigrationScript(
        prisma,
        ctx.template.migrationScript,
        // TODO test a matrix of data sources
        params.datasourceProvider
      )

      /**
       * Test 3
       * Check the seed again but this time using the derived seed function.
       */
      // TODO improve seed scripts to return reports that we can use to capture feedback here not to mention for users generally.
      await ctx.template.seed({ prisma })
    } finally {
      await Promise.all([prisma.$disconnect(), prismaAdmin.$disconnect()])
    }

    /**
     * Test 4
     * Check the development project script. For most templates this will run some kind of sandbox script against the database.
     *
     * The Nextjs template launches next dev for its dev script and thus is exempt from this test.
     */
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
