import { PrismaTemplates } from '~/src'

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  it(`Setting referentialIntegrity to the default does nothing because it is the Prisma default already: ${Template.metadata.displayName}`, () => {
    const template = new Template({
      datasourceProvider: 'postgres',
      repositoryOwner: 'prisma',
      repositoryHandle: 'templates-node',
      referentialIntegrity: 'foreignKeys',
    })
    expect(template.files['prisma/schema.prisma'].content).not.toMatch(/referentialIntegrity/)
  })
})

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  it(`Setting referentialIntegrity to non-default changes the PSL output: ${Template.metadata.displayName}`, () => {
    const template = new Template({
      datasourceProvider: 'postgres',
      repositoryOwner: 'prisma',
      repositoryHandle: 'templates-node',
      referentialIntegrity: 'prisma',
    })
    expect(template.files['prisma/schema.prisma'].content).toMatch(/referentialIntegrity *= *"prisma"/)
    expect(template.files['prisma/schema.prisma'].content).toMatch(
      /previewFeatures.+"referentialIntegrity"\]/
    )
  })
})

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  it(`By default referentialIntegrity is set to foreignKeys: ${Template.metadata.displayName}`, () => {
    const template = new Template({
      datasourceProvider: 'postgres',
      repositoryOwner: 'prisma',
      repositoryHandle: 'templates-node',
    })
    expect(template.files['prisma/schema.prisma'].content).not.toMatch(/referentialIntegrity/)
  })
})
