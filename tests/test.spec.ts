import { PrismaTemplates } from '~/src'

describe('Template classes have static data', () => {
  describe('files', () => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(Template.metadata.name, () => {
        expect(Template.files).toMatchSnapshot()
      })
    })
  })
  describe('artifcats', () => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(Template.metadata.name, () => {
        expect(Template.artifacts).toMatchSnapshot()
      })
    })
  })
  describe('metadata', () => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(Template.metadata.name, () => {
        expect(Template.metadata).toMatchSnapshot()
      })
    })
  })
})

describe('templates can be instantiated', () => {
  describe('with custom datasourceProvider', () => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(Template.metadata.name, () => {
        const template = new Template({
          datasourceProvider: 'mysql',
        })
        expect(template).toMatchSnapshot()
      })
    })
  })
  describe('with custom repository owner and repository handle', () => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(Template.metadata.name, () => {
        const template = new Template({
          datasourceProvider: 'mysql',
          repositoryOwner: 'prisma',
          repositoryHandle: 'templates-node',
        })
        expect(template.files['README.md']).toMatchSnapshot()
      })
    })
  })
  describe('with custom engineType', () => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(Template.metadata.name, () => {
        const template = new Template({
          datasourceProvider: 'mysql',
          repositoryOwner: 'prisma',
          repositoryHandle: 'templates-node',
          engineType: 'library',
        })
        expect(template.files['prisma/schema.prisma']).toMatchSnapshot()
      })
    })
  })
  describe('with custom @prisma/client dependency', () => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(Template.metadata.name, () => {
        const template = new Template({
          datasourceProvider: 'mysql',
          repositoryOwner: 'prisma',
          repositoryHandle: 'templates-node',
          engineType: 'dataproxy',
        })
        expect(template.files['package.json']).toMatchSnapshot()
      })
    })
  })
})
