import { PrismaTemplates } from '../../src'
import { konn, providers } from 'konn'
import { values } from 'lodash'
import stripAnsi from 'strip-ansi'

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
        })

      const dropTestDatabase = async () => {
        const PrismaClientModule = await getPrismaClientModule()
        const prisma = new PrismaClientModule.PrismaClient({
          datasources: {
            db: {
              // Make sure this connection not on same database that we want to drop.
              url: `${databaseUrlBase}/postgres`,
            },
          },
        })
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

    await ctx.fs.writeAsync(`.npmrc`, `scripts-prepend-node-path=true`)
    await Promise.all(values(ctx.template.files).map((file) => ctx.fs.writeAsync(file.path, file.content)))
    ctx.run(`npm install`)
    await ctx.fs.writeAsync('.env', `DATABASE_URL='${ctx.databaseUrl}'`)
    if (params.templateName === 'Empty') return

    await ctx.dropTestDatabase()

    const initResult = ctx.run(`npm run init`, { reject: true })
    expect(initResult.stderr).toMatch('')
    expect(stripAnsi(initResult.stdout)).toMatch('Generated Prisma Client')
    expect(stripAnsi(initResult.stdout)).toMatch('The seed command has been executed.')

    // TODO only empty template does not have this artifact. Our short circuit above should narrow the type here...
    if ('prisma/seed.js' in ctx.template.artifacts) {
      const prisma = await ctx.getPrisma()
      try {
        const seedModuleFile = ctx.template.artifacts['prisma/seed.js']
        ctx.fs.write('seedModule.js', seedModuleFile.content)
        const seedModule = require(ctx.fs.path('seedModule.js'))
        // TODO improve seed scripts to return reports that we can use to capture feedback here not to mention for users generally.
        await seedModule.run({ prisma })
      } finally {
        await prisma.$disconnect()
      }
    }

    const devResult = ctx.run(`npm run dev`, { reject: true })
    expect(devResult.stderr).toMatch('')
    expect(devResult.stdout).toMatch(params.expectedDevOutput)

    // TODO Test the Vercel API
    // await ctx.fs.writeAsync('.vercel/project.json', {
    //   projectId: 'prj_6yrTe9CGQagAQwGjr7JEejkxhz3A',
    //   orgId: 'team_ASKXQ5Yc1an2RqJc5BCI9rGw',
    // })
  })
}
