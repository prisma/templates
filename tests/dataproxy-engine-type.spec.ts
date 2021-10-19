import { PrismaTemplates } from '~/src'

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  it(`${Template.metadata.displayName}`, () => {
    const template = new Template({
      datasourceProvider: 'mysql',
      repositoryOwner: 'prisma',
      repositoryHandle: 'templates-node',
      engineType: 'dataproxy',
    })
    expect(template.files['prisma/schema.prisma']).toMatchSnapshot()
  })
})
