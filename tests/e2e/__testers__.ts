import { PrismaTemplates } from '../../src'
import { konn, providers } from 'konn'
import { values } from 'lodash'
import stripAnsi from 'strip-ansi'
import { ClientBase } from '@prisma-spectrum/reflector/dist-cjs/Client'
import { Reflector } from '@prisma-spectrum/reflector'

export const testTemplate = (params: {
  templateName: PrismaTemplates.$Types.Template['_tag']
  /** A string or regex pattern of the expected output (stdout) when the project dev mode is run.*/
  expectedDevOutput: RegExp | string
}) => {
  jest.setTimeout(50_000)

  const ctx = konn()
    .useBeforeAll(providers.dir())
    .useBeforeAll(providers.run())
    .beforeAll(async (ctx) => {
      const Template = PrismaTemplates.Templates[params.templateName]
      const template = new Template({
        dataproxy: false,
        datasourceProvider: 'postgres',
        repositoryOwner: 'prisma',
        repositoryHandle: `templates-node-test-${Template.metadata.handles.kebab}`,
      })
      const databaseUrlBase = 'postgres://prisma:prisma@localhost:5401'
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
      const getPrismaAdmin = async () =>
        new (await getPrismaClientModule()).PrismaClient({
          datasources: {
            db: {
              url: `${databaseUrlBase}/postgres`,
            },
          },
        }) as ClientBase

      const dropTestDatabase = async () => {
        const prisma = await getPrismaAdmin()
        try {
          await prisma.$executeRawUnsafe(`DROP DATABASE ${databaseName} WITH (FORCE);`)
        } catch (error) {
          const isDatabaseNotFoundErorr = error instanceof Error && error.message.match(/does not exist/)
          if (!isDatabaseNotFoundErorr) throw error
        } finally {
          await prisma.$disconnect()
        }
      }

      return {
        getPrisma,
        getPrismaAdmin,
        template,
        dropTestDatabase,
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

  it(`${params.templateName}`, async () => {
    // Useful log during development to manually explore/debug the test project.
    if (!process.env.CI) console.log(ctx.fs.cwd())

    /**
     * Setup the project. Write files to disk, install deps, etc.
     */
    await ctx.fs.writeAsync(`.npmrc`, `scripts-prepend-node-path=true`)
    await Promise.all(values(ctx.template.files).map((file) => ctx.fs.writeAsync(file.path, file.content)))
    ctx.run(`npm install`)
    await ctx.fs.writeAsync('.env', `DATABASE_URL='${ctx.databaseUrl}'`)

    /**
     * Exit early for empty tempalte as there is nothing more to test.
     */
    if (ctx.template._tag === 'Empty') return

    /**
     * Drop database before running the tests case it wasn't cleaned up from the previous test run.
     */
    await ctx.dropTestDatabase()

    /**
     * Test 1
     * Check that the initialization script works. This includes running migrate triggering generators and executing the seed.
     */
    const initResult = ctx.run(`npm run init`, { reject: true })
    expect(initResult.stderr).toMatch('')
    expect(stripAnsi(initResult.stdout)).toMatch('Generated Prisma Client')
    expect(stripAnsi(initResult.stdout)).toMatch('The seed command has been executed.')

    const prisma = await ctx.getPrisma()
    const prismaAdmin = await ctx.getPrismaAdmin()

    try {
      /**
       * Test 2
       * Check that the template migration script works.
       */
      await ctx.dropTestDatabase()
      await prismaAdmin.$executeRawUnsafe(`create database ${ctx.databaseName}`)
      await Reflector.Client.runMigrationScript(
        prisma,
        ctx.template.migrationScript,
        // TODO test a matrix of data sources
        'postgres'
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
