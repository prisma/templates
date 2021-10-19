import { PrismaTemplates } from '~/src'

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  it(`${Template.metadata.name}`, () => {
    const template = new Template({
      datasourceProvider: 'mongodb',
      repositoryOwner: 'prisma',
      repositoryHandle: 'templates-node',
      engineType: 'dataproxy',
    })
    expect(template.files['prisma/schema.prisma']).toMatchSnapshot()
  })
})
