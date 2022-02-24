import { PrismaTemplates } from '~/src'
import { PrismaUtils } from '@prisma/utils'

describe('with custom datasourceProvider', () => {
  Object.values(PrismaUtils.Schema.ProviderTypeNormalized._def.values).forEach((datasourceProvider) => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(`${Template.metadata.displayName} X ${datasourceProvider}`, () => {
        const template = new Template({
          datasourceProvider,
        })
        expect(template).toMatchSnapshot()
      })
    })
  })
})

describe('with custom repository owner and repository handle', () => {
  Object.values(PrismaTemplates.Templates).forEach((Template) => {
    it(Template.metadata.displayName, () => {
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
    it(Template.metadata.displayName, () => {
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

describe('with no custom engineType', () => {
  Object.values(PrismaTemplates.Templates).forEach((Template) => {
    it(Template.metadata.displayName, () => {
      const template = new Template({
        datasourceProvider: 'mysql',
      })
      expect(template.files['prisma/schema.prisma']).toMatchSnapshot()
    })
  })
})

describe('with custom @prisma/client dependency not set to binary', () => {
  Object.values(PrismaTemplates.Templates).forEach((Template) => {
    it(Template.metadata.displayName, () => {
      const template = new Template({
        datasourceProvider: 'mysql',
        repositoryOwner: 'prisma',
        repositoryHandle: 'templates-node',
        engineType: 'library',
      })
      expect(template.files['package.json']).toMatchSnapshot()
    })
  })
})

describe('with custom @prisma/client dependency not set at all', () => {
  Object.values(PrismaTemplates.Templates).forEach((Template) => {
    it(Template.metadata.displayName, () => {
      const template = new Template({
        datasourceProvider: 'mysql',
        repositoryOwner: 'prisma',
        repositoryHandle: 'templates-node',
      })
      expect(template.files['package.json']).toMatchSnapshot()
    })
  })
})
