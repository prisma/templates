import { PrismaTemplates } from '~/src'

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  it(`${Template.metadata.displayName}`, () => {
    const template = new Template({
      datasourceProvider: 'mongodb',
      repositoryOwner: 'prisma',
      repositoryHandle: 'templates-node',
      dataproxy: true,
    })
    expect(template.files['prisma/schema.prisma']).toMatchSnapshot()
  })
})
