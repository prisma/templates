import { PrismaTemplates } from '~/src'

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  describe(Template.metadata.displayName, () => {
    it(`Setting referentialIntegrity to the default does nothing because it is the Prisma default already`, () => {
      const template = new Template({
        datasourceProvider: 'postgres',
        repositoryOwner: 'prisma',
        repositoryHandle: 'templates-node',
        referentialIntegrity: 'foreignKeys',
      })
      expect(template.files['prisma/schema.prisma'].content).not.toMatch(/referentialIntegrity/)
    })
    it(`Setting referentialIntegrity explicitly to undefined is like passing nothing`, () => {
      const template = new Template({
        datasourceProvider: 'postgres',
        repositoryOwner: 'prisma',
        repositoryHandle: 'templates-node',
        referentialIntegrity: undefined,
      })
      expect(template.files['prisma/schema.prisma'].content).not.toMatch(/referentialIntegrity/)
    })
    it(`Setting referentialIntegrity to non-default changes the PSL output`, () => {
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
    it(`By default referentialIntegrity is set to foreignKeys`, () => {
      const template = new Template({
        datasourceProvider: 'postgres',
        repositoryOwner: 'prisma',
        repositoryHandle: 'templates-node',
      })
      expect(template.files['prisma/schema.prisma'].content).not.toMatch(/referentialIntegrity/)
    })
  })
})
