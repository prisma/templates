import { PrismaTemplates } from '~/src'

describe('files', () => {
  Object.values(PrismaTemplates.Templates).forEach((Template) => {
    it(Template.metadata.displayName, () => {
      expect(Template.files).toMatchSnapshot()
    })
  })
})
describe('metadata', () => {
  Object.values(PrismaTemplates.Templates).forEach((Template) => {
    it(Template.metadata.displayName, () => {
      expect(Template.metadata).toMatchSnapshot()
    })
  })
})
