import { PrismaTemplates } from '~/src'

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  it.only(`${Template.metadata.displayName}`, () => {
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
  it(`is enabled by default: ${Template.metadata.displayName}`, () => {
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

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  it(`can be disabled: ${Template.metadata.displayName}`, () => {
    const template = new Template({
      datasourceProvider: 'mysql',
      repositoryOwner: 'prisma',
      repositoryHandle: 'templates-node',
      dataproxy: false,
    })
    expect(template.files['prisma/schema.prisma']).toMatchSnapshot()
  })
})
