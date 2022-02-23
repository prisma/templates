import endent from 'endent'
import { range } from 'lodash'
import { tools } from '~/src/fileTransformer/fileTransformer'
import { DatasourceProvider } from '../cli/generate-migration-sql'
import { File } from '../../src/types'
import { Data } from '~/src/data'

// https://regex101.com/r/dUmmIu/1
export const datasourceUrlPattern = /(.*datasource.*{*url\s*=\s*env\(")([^"]+)("\).*)/s

export function setSchemaDatasourceUrlEnvarName(schema: string, envarName: string): string {
  return schema.replace(datasourceUrlPattern, `$1${envarName}$3`)
}

export const datasourceUrlEnvironmentVariableName = `PRISMA_CLOUD_PROJECT_DATASOURCE_URL`

/**
 * Source code helper for building nice separations between code sections
 */
export function sourceCodeSectionHeader(name: string): string {
  return endent`
    //
    //
    // ${name}
    //
    //
  `
}

/**
 * Prepare source code to be written into backticks
 */
export function escapeBackticks(s: string): string {
  // When we write to disk, we put file contents inside an endent`` block. But what if the file content itself has backticks (`)?
  // In that case, we must escape backticks, and we must escape string interpolations as well

  return (
    s
      // eslint-disable-next-line no-useless-escape
      .replace(/`/gm, /* prettier-ignore */ '\\\\`') // Replace ` with \`
      // eslint-disable-next-line no-useless-escape
      .replace(/\$\{/gm, /* prettier-ignore */ '\\\${')
  ) // Replace ${ with \${
}

/**
 * Indent every newline in given content by size.
 */
export const indentBlock = (size: number, block: string): string => {
  return block
    .split('\n')
    .map(
      (_) =>
        `${range(size)
          .map((_) => ' ')
          .join('')}${_}`
    )
    .join('\n')
}

export const globalBackticks = /\u0060/g
/**
 * @returns Array of content split at each semi colon with white space and back ticks removed.
 */
export const clean = (content?: string): string[] => {
  return content
    ? content
        .trim()
        .replace(globalBackticks, '')
        .split(';')
        .filter((s) => s !== '')
    : []
}

/**
 * @returns File contents with replaced datasource. File path and content parameters do not need to match.
 */
export function replaceProvider(datasourceProvider: DatasourceProvider, file: File) {
  return tools.replaceContent({
    file,
    pattern: /provider *= *"postgresql"/,
    replacement: `provider = "${datasourceProvider}"`,
  })
}

/**
 * @returns Modified schema content with referentialIntegrity preview feature enabled and value = "prisma"
 *          if referentialIntegrity parameter is false.
 */
export function replaceReferentialIntegrity(params: { file: File; referentialIntegrity: boolean }) {
  let content = params.file.content
  if (!params.referentialIntegrity) {
    content = tools.prismaSchema.addPreviewFlag({
      file: params.file,
      previewFlag: Data.PreviewFlag.referentialIntegrity,
    })
    content = tools.prismaSchema.setReferentialIntegrity({
      file: {
        ...params.file,
        content,
      },
      value: 'prisma',
    })
  }
  return content
}

/**
 * @returns A valid dummy connection string for the given datasource provider.
 */
export function generateConnectionString(datasourceProvider: DatasourceProvider) {
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
