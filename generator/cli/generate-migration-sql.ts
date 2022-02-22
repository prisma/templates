import execa from 'execa'
import * as FS from 'fs-jetpack'
import { log } from 'floggy'
import { tools } from '../../src/fileTransformer/fileTransformer'
import { File } from '../../src/types'
import { Data } from '~/src/data'
import { getTemplateInfos } from '../lib/templates'

export type DatasourceProvider = Exclude<Data.DatasourceProviderName, 'mongodb'>

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
  templateTag: string
}

export default async function generateMigrationSql(params: {
  templatesRepoDir: string
  outputDir: string
}): Promise<void> {
  log.info(`generating migration sql`, { params })

  FS.remove(params.outputDir)

  const templateInfos = getTemplateInfos({
    templatesRepoDir: params.templatesRepoDir,
  })

  log.info(`Found templates`, { templates: templateInfos.map((t) => t.displayName) })

  const indexFile = `${params.outputDir}/index.ts`

  const exportsList: { template: string; provider: string }[] = []
  const providers: DatasourceProvider[] = ['postgresql', 'mysql', 'sqlserver', 'sqlite']

  const referentialIntegrityValues = [true, false] as const

  const combinations = referentialIntegrityValues.flatMap((referentialIntegrity) =>
    templateInfos.flatMap((t) =>
      providers.map(
        (datasourceProvider): Combination => ({
          referentialIntegrity,
          templateTag: t.handles.pascal.value,
          datasourceProvider,
        })
      )
    )
  )

  log.info(`Found migration sql combinations`, { count: combinations.length })

  // TODO use combinations

  await Promise.all(
    providers.map(async (provider) => {
      await Promise.all(
        templateInfos.map((t) => {
          const templateName = t.displayName.trim()
          const schemaPath = `./templates-repo/${templateName}/prisma/schema.prisma`
          const newSchemaPath = `/tmp/${t.handles.pascal.value}/${provider}/schema.prisma`
          const filename = `${t.handles.pascal.value}-${provider}.ts`
          const outputPath = params.outputDir + `/${filename}`
          const exportName = t.handles.pascal.value + provider
          exportsList.push({ template: t.handles.pascal.value, provider })
          // Replace schema provider for diff command
          const content = FS.read(schemaPath)
          if (!content) throw new Error('Could not copy')
          const modifiedSchema = replaceProvider(provider, { content: content, path: schemaPath })
          // Write modified schema to disk
          FS.remove(newSchemaPath)
          FS.file(newSchemaPath)
          FS.write(newSchemaPath, modifiedSchema)
          log(`Wrote modified template schema to ${newSchemaPath}`)
          // Make sure output path exists
          FS.file(outputPath)
          const res = execa.commandSync(
            `yarn prisma migrate diff --preview-feature --from-empty --to-schema-datamodel ${newSchemaPath}  --script`,
            {
              cwd: process.cwd(),
              env: {
                DATABASE_URL: connectionString(provider),
              },
            }
          )
          // Remove command that is returned in migrate diff response
          const substr = '--script'
          const commandIndexEnd = res.stdout.indexOf(substr)
          // Write response to disk as ts
          const contents = JSON.stringify(splitSql(res.stdout.substr(commandIndexEnd + substr.length)))
          const formatted = `const ${exportName} = ` + `${contents}` + `;export default ${exportName}`
          FS.write(outputPath, formatted)
          log(`Output to ${outputPath}`)
        })
      )
    })
  )
  log(`Done generating all migration sql.`)
  // Add individual exports to generatedMigrations/index.ts
  FS.write(indexFile, '')
  const createImportsList: string = exportsList.reduce((acc, { template, provider }) => {
    return acc + `import ${template}${provider} from "./${template}-${provider}"; \n`
  }, '')
  const createExportsList: string = exportsList.reduce((acc, { template, provider }) => {
    return acc + template + provider + ','
  }, '')
  FS.append(indexFile, createImportsList + `export default {${createExportsList}}`)

  return Promise.resolve()
}

const splitSql = (content?: string): string[] => {
  return content ? content.trim().split(';') : []
}

function replaceProvider(datasourceProvider: DatasourceProvider, file: File) {
  return tools.replaceContent({
    file,
    pattern: /provider *= *"postgresql"/,
    replacement: `provider = "${datasourceProvider}"`,
  })
}

function connectionString(datasourceProvider: DatasourceProvider) {
  switch (datasourceProvider) {
    case 'postgresql':
      return 'postgresql://prisma:prisma@localhost:5444/doesntexist'
    case 'mysql':
      return 'mysql://prisma:prisma@localhost:5444/doesntexist'
    case 'sqlserver':
      return 'sqlserver://localhost:5444;database=doesntexist;user=prisma;password=prisma;encrypt=true'
    case 'sqlite':
      return 'file:./dev.db'
    default:
      return ''
  }
}
