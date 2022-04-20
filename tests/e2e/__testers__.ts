import { PrismaTemplates } from '../../src'
import { konn, providers } from 'konn'
import { values } from 'lodash'

export const testTemplate = (templateName: PrismaTemplates.$Types.Template['_tag']) => {
  jest.setTimeout(20_000)

  const ctx = konn()
    .beforeAll(() => ({
      databaseUrlBase: 'postgres://prisma:prisma@localhost:5401',
    }))
    .useBeforeAll(providers.dir())
    .useBeforeAll(providers.run())
    .done()

  it(`${templateName}`, async () => {
    console.log(ctx.fs.cwd())
    const Template = PrismaTemplates.Templates[templateName]
    const template = new Template({
      dataproxy: false,
      datasourceProvider: 'postgres',
      repositoryOwner: 'prisma',
      repositoryHandle: `templates-node-test-${Template.metadata.handles.kebab}`,
    })
    await Promise.all(values(template.files).map((file) => ctx.fs.writeAsync(file.path, file.content)))
    await ctx.run(`npm install`)
    await ctx.fs.writeAsync(
      '.env',
      `DATABASE_URL='${ctx.databaseUrlBase}/${template.metadata.handles.snake}'`
    )

    const initResult = await ctx.run(`npm run init`, { reject: true })
    expect(initResult.stderr).toMatchSnapshot('init stderr')
    expect(initResult.stdout.replace(/\d+ms/g, 'XXXms')).toMatchSnapshot('init stdout')

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
