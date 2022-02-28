import { PrismaUtils } from '@prisma/utils'
import { PromisePool } from '@supercharge/promise-pool'
import { PrismaTemplates } from '~/src'
import { DatasourceProvidersNormalizedSupportingMigration, getName } from '~/src/logic/migrationSql/helpers'
import { getTemplateInfos } from '~/src/templates'
import { clean } from '~/src/utils'
import execa from 'execa'
import { log as rootLog } from 'floggy'
import * as FS from 'fs-jetpack'
import * as Remeda from 'remeda'

const log = rootLog.child('generateMigrationSql')

interface Combination {
  /**
   * Should referential integrity be used or not?
   */
  referentialIntegrity: PrismaUtils.Schema.ReferentialIntegritySettingValue
  /**
   * What database to use?
   */
  datasourceProvider: DatasourceProvidersNormalizedSupportingMigration
  /**
   * What template to use?
   */
  template: PrismaTemplates.$Types.TemplateTag
  /**
   * Template name used in path to schema.prisma
   */
  templateName: string
}

export default async function generateMigrationSql(params: {
  templatesRepoDir: string
  outputDir: string
}): Promise<void> {
  log.info(`generating migration sql`, { params })

  await FS.removeAsync(params.outputDir)

  const templateInfos = getTemplateInfos({
    templatesRepoDir: params.templatesRepoDir,
  })

  log.info(`Found templates`, { templates: templateInfos.map((t) => t.displayName) })

  const providers = Object.values(
    Remeda.omit(PrismaUtils.Schema.ProviderTypeNormalized._def.values, ['mongodb'])
  )

  const referentialIntegrityValues = Object.values(PrismaUtils.Schema.ReferentialIntegritySettingValue)

  const combinations = referentialIntegrityValues.flatMap((referentialIntegrity) =>
    templateInfos.flatMap((t) =>
      providers.map(
        (datasourceProvider): Combination => ({
          referentialIntegrity,
          datasourceProvider,
          template: t.handles.pascal.value as PrismaTemplates.$Types.TemplateTag,
          templateName: t.displayName.trim(),
        })
      )
    )
  )

  log.info(`Found migration sql combinations`, { combinations })

  const { results, errors } = await PromisePool.withConcurrency(50)
    .for(combinations)
    .process(async (combination) => {
      const SchemaPathTemplateOriginal = `${params.templatesRepoDir}/${combination.templateName}/prisma/schema.prisma`
      const SchemaPathThisCombo = `/tmp/t-${combination.template}/p-${combination.datasourceProvider}/ri-${combination.referentialIntegrity}/schema.prisma`

      const content = await FS.readAsync(SchemaPathTemplateOriginal)
      if (!content) throw new Error(`Could not read schema at path ${SchemaPathTemplateOriginal}`)

      const schemaWithProvider = PrismaUtils.Schema.replaceSchemaProvider({
        prismaSchemaContent: content,
        datasourceProvider: combination.datasourceProvider,
      })
      const schemaWithReferentialIntegrity = PrismaUtils.Schema.addPreviewFlag({
        prismaSchemaContent: schemaWithProvider,
        previewFlag: 'referentialIntegrity',
      })
      const schemaWithReferentialIntegrityComplete = PrismaUtils.Schema.setReferentialIntegrity({
        prismaSchemaContent: schemaWithReferentialIntegrity,
        value: combination.referentialIntegrity,
      })

      await FS.writeAsync(SchemaPathThisCombo, schemaWithReferentialIntegrityComplete)
      log.info(`Wrote template schema for combo to disk`, { path: SchemaPathThisCombo })

      const res = await execa.command(
        `yarn prisma migrate diff --preview-feature --from-empty --to-schema-datamodel ${SchemaPathThisCombo}  --script`,
        {
          cwd: process.cwd(),
          env: {
            DATABASE_URL: PrismaUtils.ConnectionString.generate(combination.datasourceProvider),
          },
        }
      )

      const substr = '--script'
      const commandIndexEnd = res.stdout.indexOf(substr)
      let rawContent = res.stdout.substr(commandIndexEnd + substr.length)
      if (combination.datasourceProvider === 'sqlserver') {
        const substr = 'BEGIN TRAN'
        const commandIndexEnd = rawContent.indexOf(substr)
        rawContent = rawContent.substr(commandIndexEnd + substr.length)
        const substrEnd = 'COMMIT TRAN'
        const commandIndexEndEnd = rawContent.indexOf(substrEnd)
        rawContent = rawContent.substr(0, commandIndexEndEnd)
      }

      const exportName = getName(combination)
      const formattedContent = JSON.stringify(clean(rawContent), null, 2)
      const moduleName = exportName
      const moduleFilePath = params.outputDir + `/${moduleName}.ts`

      await FS.writeAsync(moduleFilePath, `export const ${exportName} = ${formattedContent}`)
      log.info(`Wrote migration module`, { path: moduleFilePath })

      return {
        moduleName,
      }
    })

  if (errors.length > 0) {
    log.error(`there were errors`, {
      errors,
    })
  }

  log.info(`Done writing all migration sql modules`)

  const indexExportsModuleFilePath = `${params.outputDir}/index_.ts`
  const indexExportsModule = results.map((result) => `export * from './${result.moduleName}'`, '').join('\n')
  await FS.writeAsync(indexExportsModuleFilePath, indexExportsModule)
  log.info(`Wrote exports index module`, { path: indexExportsModuleFilePath })

  const indexNamespaceModuleFilePath = `${params.outputDir}/index.ts`
  const indexNamespaceModule = `export * as MigrationsSql from './index_'`
  await FS.writeAsync(indexNamespaceModuleFilePath, indexNamespaceModule)
  log.info(`Wrote namespace index module`, { path: indexExportsModuleFilePath })
  log.info(`Done`)
}
