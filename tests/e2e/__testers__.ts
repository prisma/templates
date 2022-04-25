import { PrismaTemplates } from '../../src'
import { konn, providers } from 'konn'
import { values } from 'lodash'
import stripAnsi from 'strip-ansi'
import * as PG from 'pg'

export const testTemplate = (templateName: PrismaTemplates.$Types.Template['_tag']) => {
  jest.setTimeout(20_000)

  const ctx = konn()
    .useBeforeAll(providers.dir())
    .useBeforeAll(providers.run())
    .beforeAll(async () => {
      const Template = PrismaTemplates.Templates[templateName]
      const template = new Template({
        dataproxy: false,
        datasourceProvider: 'postgres',
        repositoryOwner: 'prisma',
        repositoryHandle: `templates-node-test-${Template.metadata.handles.kebab}`,
      })
      const databaseUrlBase = 'postgres://prisma:prisma@localhost:5401'
      const databaseName = template.metadata.handles.snake
      const databaseUrl = `${databaseUrlBase}/${databaseName}`

      const dropTestDatabase = async () => {
        const Prisma = await import(`${ctx.fs.cwd()}/node_modules/@prisma/client`)
        const prisma = new Prisma.PrismaClient({
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
        template,
        dropTestDatabase,
        databaseName,
        databaseUrl,
      }
    })
    .afterAll(async (ctx) => {
      if (templateName !== 'Empty') {
        await ctx.dropTestDatabase?.()
      }
    })
    .done()

  it(`${templateName}`, async () => {
    // Useful log during development to manually explore/debug the test project.
    if (!process.env.CI) console.log(ctx.fs.cwd())

    await ctx.fs.writeAsync(`.npmrc`, `scripts-prepend-node-path=true`)
    await Promise.all(values(ctx.template.files).map((file) => ctx.fs.writeAsync(file.path, file.content)))
    await ctx.run(`npm install`)
    await ctx.fs.writeAsync('.env', `DATABASE_URL='${ctx.databaseUrl}'`)
    if (templateName === 'Empty') return

    await ctx.dropTestDatabase()

    const initResult = await ctx.run(`npm run init`, { reject: true })
    expect(initResult.stderr).toMatchSnapshot('init stderr')
    expect(stripAnsi(initResult.stdout.replace(/(?:\d+\.)?\d+m?s/g, 'XXXms'))).toMatchSnapshot('init stdout')

    const devResult = await ctx.run(`npm run dev`, { reject: true })
    expect(devResult.stderr).toMatchSnapshot('dev stderr')
    expect(devResult.stdout).toMatch(/Top users \(alphabetical\):/)

    // TODO Test the Vercel API
    // await ctx.fs.writeAsync('.vercel/project.json', {
    //   projectId: 'prj_6yrTe9CGQagAQwGjr7JEejkxhz3A',
    //   orgId: 'team_ASKXQ5Yc1an2RqJc5BCI9rGw',
    // })
  })
}
