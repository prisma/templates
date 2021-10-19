import { PrismaTemplates } from '~/src'

describe('vercel button', () => {
  describe('with dataproxy', () => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(`${Template.metadata.name}`, () => {
        const template = new Template({
          datasourceProvider: 'mysql',
          repositoryOwner: 'prisma',
          repositoryHandle: 'templates-node',
          engineType: 'dataproxy',
        })
        expect(template.files['README.md'].content.match(/Deploy with Vercel.*/)?.[0]).toMatch(
          /.*env=DATABASE_URL,DATABASE_MIGRATE_URL,PRISMA_CLIENT_ENGINE_TYPE&.*/
        )
      })
    })
  })
  describe('without dataproxy', () => {
    Object.values(PrismaTemplates.Templates).forEach((Template) => {
      it(`${Template.metadata.name}`, () => {
        const template = new Template({
          datasourceProvider: 'mysql',
          repositoryOwner: 'prisma',
          repositoryHandle: 'templates-node',
          engineType: 'binary',
        })
        expect(template.files['README.md'].content.match(/Deploy with Vercel.*/)?.[0]).toMatch(
          /.*env=DATABASE_URL,DATABASE_MIGRATE_URL&.*/
        )
      })
    })
  })
})
