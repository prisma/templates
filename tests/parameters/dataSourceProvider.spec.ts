import { values } from 'lodash'
import { PrismaTemplates } from '~/src'
import { DatasourceProvidersNormalizedSupportingMigration } from '~/src/logic/migrationScript'

Object.values(PrismaTemplates.Templates).forEach((Template) => {
  values(DatasourceProvidersNormalizedSupportingMigration.enum).forEach((datasourceProvider) => {
    it(`${Template.metadata.displayName} X ${datasourceProvider}`, () => {
      const template = new Template({
        datasourceProvider,
        repositoryOwner: 'prisma',
        repositoryHandle: 'templates-node',
        dataproxy: true,
      })
      expect(template.files['prisma/schema.prisma'].content).toMatch(
        new RegExp(`provider = "${datasourceProvider}"`)
      )
      if (Template._tag !== 'Empty' && datasourceProvider === 'cockroachdb') {
        expect(template.files['prisma/schema.prisma'].content).not.toMatch(/autoincrement\(\)/g)

        // Only Blog template uses Int IDs
        if (Template._tag === 'Nextjs') {
          expect(template.files['prisma/schema.prisma'].content).toMatch(/sequence\(\)/g)
        }
      }
    })
  })
})
