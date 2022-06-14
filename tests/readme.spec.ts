import { PrismaTemplates } from '~/src'

describe('vercel button', () => {
  describe('with dataproxy', () => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(`${Template.metadata.displayName}`, () => {
        const template = new Template({
          datasourceProvider: 'mysql',
          repositoryOwner: 'prisma',
          repositoryHandle: 'templates-node',
          dataproxy: true,
        })
        expect(template.files['README.md'].content.match(/Deploy with Vercel.*/)?.[0]).toMatch(
          /.*env=DATABASE_URL,DATABASE_MIGRATE_URL&.*/
        )
      })
    })
  })
  describe('without dataproxy', () => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(`${Template.metadata.displayName}`, () => {
        const template = new Template({
          datasourceProvider: 'mysql',
          repositoryOwner: 'prisma',
          repositoryHandle: 'templates-node',
          dataproxy: false,
        })
        expect(template.files['README.md'].content.match(/Deploy with Vercel.*/)?.[0]).toMatch(
          /.*env=DATABASE_URL,DATABASE_MIGRATE_URL&.*/
        )
      })
    })
  })
})
