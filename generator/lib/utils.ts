import endent from 'endent'
import { range } from 'lodash'

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
