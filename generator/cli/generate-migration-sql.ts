import execa from 'execa'
import * as FS from 'fs-jetpack'
import { log } from 'floggy'
import { getTemplateInfos } from '~/src/templates'
import { clean, upperFirst } from '~/src/utils'
import { MigrationFileName } from '~/src/logic/migrationSql'
import { PrismaTemplates } from '~/src'
import { DatasourceProvider } from '~/src/types'
import { PromisePool } from '@supercharge/promise-pool'
import { PrismaUtils } from '@prisma/utils'
import * as Remeda from 'remeda'

interface Combination {
  /**
   * Should referential integrity be used or not?
   */
  referentialIntegrity: PrismaUtils.Schema.ReferentialIntegritySettingValue
  /**
   * What database to use?
   */
  datasourceProvider: DatasourceProvider
  /**
   * What template to use?
   */
  templateTag: PrismaTemplates.$Types.TemplateTag
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
    Remeda.omit(PrismaUtils.Schema.DatasourceProviderNormalized._def.values, ['mongodb'])
  )

  const referentialIntegrityValues = Object.values(PrismaUtils.Schema.ReferentialIntegritySettingValue)

  const combinations = referentialIntegrityValues.flatMap((referentialIntegrity) =>
    templateInfos.flatMap((t) =>
      providers.map(
        (datasourceProvider): Combination => ({
          referentialIntegrity,
          datasourceProvider,
          templateTag: t.handles.pascal.value as PrismaTemplates.$Types.TemplateTag,
          templateName: t.displayName.trim(),
        })
      )
    )
  )
  // const combinations: Combination[] = [
  //   {
  //     datasourceProvider: 'mysql',
  //     referentialIntegrity: 'foreignKeys',
  //     templateName: 'Blog',
  //     templateTag: 'Nextjs',
  //   },
  // ]

  log.info(`Found migration sql combinations`, { combinations })

  const { results, errors } = await PromisePool.withConcurrency(50)
    .for(combinations)
    .process(async (combination) => {
      const schemaPath = `${params.templatesRepoDir}/${combination.templateName}/prisma/schema.prisma`
      const newSchemaPath = `/tmp/t-${combination.templateTag}/p-${combination.datasourceProvider}/ri-${combination.referentialIntegrity}/schema.prisma`
      const exportName: MigrationFileName = `${combination.templateTag}With${upperFirst(
        combination.datasourceProvider
      )}WithReferentialIntegrity${upperFirst(combination.referentialIntegrity)}`
      const content = await FS.readAsync(schemaPath)
      if (!content) throw new Error(`Could not read schema at path ${schemaPath}`)
      const schemaWithProvider = PrismaUtils.Schema.setDatasourceProvider({
        prismaSchemaContent: content,
        value: combination.datasourceProvider,
      })
      const schemaWithReferentialIntegrity = PrismaUtils.Schema.setReferentialIntegrity({
        prismaSchemaContent: schemaWithProvider,
        value: combination.referentialIntegrity,
      })
      // console.log(schemaWithReferentialIntegrity)
      await FS.writeAsync(newSchemaPath, schemaWithReferentialIntegrity)

      log.info(`Wrote template schema for combo to disk`, { path: newSchemaPath })

      const res = await execa.command(
        `yarn prisma migrate diff --preview-feature --from-empty --to-schema-datamodel ${newSchemaPath}  --script`,
        {
          cwd: process.cwd(),
          env: {
            DATABASE_URL: PrismaUtils.ConnectionString.generate(combination.datasourceProvider),
          },
        }
      )
      // if (res.failed) {
      //   console.log(res)
      // }
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

      const formattedContent = JSON.stringify(clean(rawContent), null, 2)
      const moduleName = exportName
      const moduleFilePath = params.outputDir + `/${moduleName}.ts`
      await FS.writeAsync(
        moduleFilePath,
        `export const ${exportName}: string[] = ` + `${formattedContent}` + `;`
      )
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
}
