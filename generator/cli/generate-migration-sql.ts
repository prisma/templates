import execa from 'execa'
import * as FS from 'fs-jetpack'
import { log } from 'console'
import { getTemplateInfos } from './generate-type-script'
import { tools } from '../../src/fileTransformer/fileTransformer'
import { File } from '../../src/types'
import { Data } from '~/src/data'

export type DatasourceProvider = Exclude<Data.DatasourceProviderName, 'mongodb' | 'sqlite'>

export default function generateMigrationSql(params: {
  templatesRepoDir: string
  outputDir: string
}): Promise<any> {
  log(`generating migration sql for each template x provider to ${params.outputDir}`)

  FS.remove(params.outputDir)

  const templateInfos = getTemplateInfos({ templatesRepoDir: params.templatesRepoDir })

  log(`Found templates:`, { templates: templateInfos.map((t) => t.displayName) })

  const providers: DatasourceProvider[] = ['postgresql', 'mysql', 'sqlserver']
  providers.map((provider) => {
    templateInfos.map((t) => {
      const templateName = t.displayName.trim()
      const schemaPath = `./templates-repo/${templateName}/prisma/schema.prisma`
      const newSchemaPath = `/tmp/${t.handles.pascal.value}/${provider}/schema.prisma`
      const outputPath = params.outputDir + `/${t.handles.pascal.value}/${provider}/migration.sql`

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
      const formatted = res.stdout.substr(commandIndexEnd + substr.length)
      // Write sql to disk
      FS.write(outputPath, formatted)
      log(`Output to ${outputPath}`)
    })
  })
  log(`Done generating all migration sql.`)
  return Promise.resolve()
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
    default:
      return ''
  }
}
