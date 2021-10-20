import { PrismaTemplates } from '~/src'

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  it(`${Template.metadata.displayName}`, () => {
    const template = new Template({
      datasourceProvider: 'mysql',
      repositoryOwner: 'prisma',
      repositoryHandle: 'templates-node',
      dataproxy: true,
    })
    expect(template.files['prisma/schema.prisma']).toMatchSnapshot()
  })
})

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  it(`dataproxy is the default: ${Template.metadata.displayName}`, () => {
    expect(
      new Template({
        datasourceProvider: 'mysql',
        repositoryOwner: 'prisma',
        repositoryHandle: 'templates-node',
        dataproxy: true,
      })
    ).toEqual(
      new Template({
        datasourceProvider: 'mysql',
        repositoryOwner: 'prisma',
        repositoryHandle: 'templates-node',
      })
    )
  })
})
