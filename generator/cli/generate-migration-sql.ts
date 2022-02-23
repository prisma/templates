import execa from 'execa'
import * as FS from 'fs-jetpack'
import { log } from 'floggy'
import { getTemplateInfos } from '~/src/templates'
import { generateConnectionString, replaceProvider, replaceReferentialIntegrity, clean } from '~/src/utils'
import { MigrationFileName } from '~/src/logic/migrationSql'
import { PrismaTemplates } from '~/src'
import { DatasourceProvider } from '~/src/types'

interface Combination {
  /**
   * Should referential integrity be used or not?
   */
  referentialIntegrity: boolean
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

export default function generateMigrationSql(params: { templatesRepoDir: string; outputDir: string }): void {
  log.info(`generating migration sql`, { params })

  FS.remove(params.outputDir)

  const templateInfos = getTemplateInfos({
    templatesRepoDir: params.templatesRepoDir,
  })

  log.info(`Found templates`, { templates: templateInfos.map((t) => t.displayName) })

  const indexFile = `${params.outputDir}/index.ts`

  const exportsList: MigrationFileName[] = []
  const providers: DatasourceProvider[] = ['postgresql', 'mysql', 'sqlserver', 'sqlite']

  const referentialIntegrityValues = [true, false] as const

  const combinations = referentialIntegrityValues.flatMap((referentialIntegrity) =>
    templateInfos.flatMap((t) =>
      providers.map(
        (datasourceProvider): Combination => ({
          referentialIntegrity,
          templateTag: t.handles.pascal.value as PrismaTemplates.$Types.TemplateTag,
          templateName: t.displayName.trim(),
          datasourceProvider,
        })
      )
    )
  )

  log.info(`Found migration sql combinations`, { count: combinations.length })
  combinations.map((combination) => {
    const schemaPath = `./templates-repo/${combination.templateName}/prisma/schema.prisma`
    const newSchemaPath = `/tmp/${combination.templateTag}/${combination.datasourceProvider}/schema.prisma`
    const exportName: MigrationFileName = `${combination.templateTag}${combination.datasourceProvider}${
      combination.referentialIntegrity ? 'ReferentialIntegrity' : ''
    }`
    const fileName = params.outputDir + `/${exportName}.ts`
    exportsList.push(exportName)
    const content = FS.read(schemaPath)
    if (!content) throw new Error('Could not copy')
    const schemaWithCorrectProvider = replaceProvider(combination.datasourceProvider, {
      content: content,
      path: schemaPath,
    })
    const schemaWithCorrectReferentialIntegrity = replaceReferentialIntegrity({
      file: { content: schemaWithCorrectProvider, path: schemaPath },
      referentialIntegrity: combination.referentialIntegrity,
    })
    FS.write(newSchemaPath, schemaWithCorrectReferentialIntegrity)

    log.info(`Wrote modified template schema to disk`, { newSchemaPath })

    const res = execa.commandSync(
      `yarn prisma migrate diff --preview-feature --from-empty --to-schema-datamodel ${newSchemaPath}  --script`,
      {
        cwd: process.cwd(),
        env: {
          DATABASE_URL: generateConnectionString(combination.datasourceProvider),
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

    const formattedContent = JSON.stringify(clean(rawContent))
    FS.write(
      fileName,
      `const ${exportName}: string[] = ` + `${formattedContent}` + `;export default ${exportName}`
    )

    log.info(`Wrote formatted migrate diff output to disk`, { fileName })
  })

  log.info(`Done generating all migration sql`)

  const createImportsList = exportsList.reduce((acc, exportName) => {
    return acc + `import ${exportName} from "./${exportName}"; \n`
  }, '')
  const createExportsList = exportsList.reduce((acc, exportName) => {
    return acc + exportName + ','
  }, '')
  FS.write(indexFile, createImportsList + `export default {${createExportsList}}`)

  log.info(`Wrote index.ts to disk in order to export all generated migration sql`)
}
