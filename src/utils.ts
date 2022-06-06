import { Reflector } from './lib/Reflector'
import endent from 'endent'
import * as R from 'remeda'

export type Index<T> = Record<string, T>

export const datasourceUrlEnvironmentVariableName = `PRISMA_CLOUD_PROJECT_DATASOURCE_URL`

/**
 * Source code helper for building nice separations between code sections
 */
export const sourceCodeSectionHeader = (name: string): string => {
  return endent`
    //
    //
    // ${name}
    // =========================================================================================
    //
    //
  `
}

/**
 * Source code helper for building nice separations between code sections
 */
export const sourceCodeSectionHeader2 = (title: string): string => {
  return endent`
    //
    // ${title}
    // ${'-'.repeat(title.length)}
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
        `${R.range(size)(0)
          .map((_) => ' ')
          .join('')}${_}`
    )
    .join('\n')
}

export const upperFirst = <S extends string>(s: S): Capitalize<S> => {
  // eslint-disable-next-line
  return (s.charAt(0).toUpperCase() + s.slice(1)) as any
}

/**
 * When using CockroachDB, the autoincrement() attribute function must be replaced with sequence()
 * to get the same behavior as autoincrement() with other datasource providers (e.g. Postgres).
 */
export const normalizeAutoincrement = (
  schema: string,
  datasourceProvider: Reflector.Schema.DatasourceProviderNormalized
) => (datasourceProvider === 'cockroachdb' ? schemaAutoincrementToSequence(schema) : schema)

const schemaAutoincrementToSequence = (schema: string) => schema.replace(/autoincrement\(\)/g, 'sequence()')
