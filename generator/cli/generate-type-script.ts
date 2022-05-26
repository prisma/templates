import { createSeedFunction } from '../lib/SeedFunction'
import { getTemplateInfos, TemplateInfo } from '~/src/templates'
import { File } from '~/src/types'
import { escapeBackticks, indentBlock, sourceCodeSectionHeader, sourceCodeSectionHeader2 } from '~/src/utils'
import endent from 'endent'
import glob from 'fast-glob'
import { log as rootLog } from 'floggy'
import * as FS from 'fs-jetpack'
import { upperFirst } from 'lodash'
import * as Path from 'path'
import * as Prettier from 'prettier'

const log = rootLog.child('generateTypeScript')

const handleKinds = [`kebab`, `pascal`, `camel`, `snake`, `upper`] as const

/**
 * Generate TypeScript code for templates in given dir .
 */
const run = async (params: {
  templatesRepoDir: string
  outputDir: string
  prettier: boolean
}): Promise<void> => {
  const { templatesRepoDir, outputDir } = params

  log.info(`generating type-script code to ${outputDir}`)

  const templateInfos = getTemplateInfos({ templatesRepoDir })

  log.info(`Found templates:`, { templates: templateInfos.map((t) => t.displayName) })

  const fileOutputs: File[] = []

  fileOutputs.push({
    path: Path.join(outputDir, `index.ts`),
    content: endent`
      export * as Generated from './index_'
    `,
  })

  fileOutputs.push({
    path: Path.join(outputDir, `index_.ts`),
    content: endent`
      export * as Templates from './templates'
      export * as Types from './types'
    `,
  })

  fileOutputs.push({
    path: Path.join(outputDir, `types.ts`),
    content: endent`
      import * as Templates from './templates'

      export type TemplateByName = {
        ${templateInfos
          .map((_) => {
            return endent`
              "${_.handles.pascal.value}": Templates.${_.handles.pascal.value}
            `
          })
          .join('\n')}
      }

      export type TemplateParametersByName = {
        ${templateInfos
          .map((_) => {
            return endent`
              "${_.handles.pascal.value}": Templates.${_.handles.pascal.value}.Parameters
            `
          })
          .join('\n')}
      }

      export type TemplateClassByName = {
        ${templateInfos
          .map((_) => {
            return endent`
              "${_.handles.pascal.value}": typeof Templates.${_.handles.pascal.value}
            `
          })
          .join('\n')}
      }
        
      export type TemplateClass =
        ${templateInfos
          .map((_) => {
            return endent`
              | typeof Templates.${_.handles.pascal.value}
            `
          })
          .join('\n')}

      export type Template =
        ${templateInfos
          .map((_) => {
            return endent`
              | Templates.${_.handles.pascal.value}
            `
          })
          .join('\n')}

      export type TemplateTag =
        ${templateInfos
          .map((_) => {
            return endent`
              | Templates.${_.handles.pascal.value}.Tag
            `
          })
          .join('\n')}

      export const TemplateTag = [
        ${templateInfos.map((_) => `Templates.${_.handles.pascal.value}._tag,`).join('\n')}
      ] as const
      

      export namespace TemplateHandle {
        ${handleKinds
          .map(
            // prettier-ignore
            (handleKind) => `export const ${upperFirst(handleKind)} = [${templateInfos.map((_) => `'${_.handles[handleKind].value}'`).join(`, `)}] as const`
          )
          .join(`\n`)}

        ${handleKinds
          .map(
            // prettier-ignore
            (handleKind) => `export type ${upperFirst(handleKind)} = ${templateInfos.map((_) => `'${_.handles[handleKind].value}'`).join(` | `)}`
          )
          .join(`\n`)}
      }

      /**
       * Convert between template metadata handle formats in a type-safe way.
       */
      export const handleMap = {
        ${templateInfos
          .map((templateInfo) => {
            return Object.entries(templateInfo.handles)
              .map(([k, item]) => {
                if (k === 'kebab' && templateInfo.handles.kebab.value === templateInfo.handles.camel.value)
                  return null
                if (k === 'snake' && templateInfo.handles.snake.value === templateInfo.handles.camel.value)
                  return null
                return endent`
                  '${item.value}': {
                    /**
                     * ${templateInfo.handles.kebab.jsdoc}
                     */
                    kebab: '${templateInfo.handles.kebab.value}',
                    /**
                     *  ${templateInfo.handles.pascal.jsdoc}
                     */
                    pascal: '${templateInfo.handles.pascal.value}',
                    /**
                     *  ${templateInfo.handles.camel.jsdoc}
                     */
                    camel: '${templateInfo.handles.camel.value}',
                    /**
                     *  ${templateInfo.handles.upper.jsdoc}
                     */
                    upper: '${templateInfo.handles.upper.value}',
                    /**
                     *  ${templateInfo.handles.snake.jsdoc}
                     */
                    snake: '${templateInfo.handles.snake.value}',
                  },
                `
              })
              .filter((_) => _ !== null)
              .join('\n')
          })
          .join('\n')}
      } as const
    `,
  })

  fileOutputs.push({
    path: Path.join(outputDir, `templates/index.ts`),
    content: endent`
      ${templateInfos
        .map((_) => {
          return `export { ${_.handles.pascal.value} } from './${_.handles.pascal.value}'`
        })
        .join('\n')}
    `,
  })

  const prettierConfigPath = await Prettier.resolveConfigFile(process.cwd())
  if (!prettierConfigPath) throw new Error(`Could not find prettier config file.`)

  const prettierConfig = await Prettier.resolveConfig(prettierConfigPath)
  if (!prettierConfig) throw new Error(`Could not read prettier config file.`)

  fileOutputs.push(
    ...templateInfos.map((_) => {
      const sourceCodePath = Path.join(outputDir, `templates/${_.handles.pascal.value}.ts`)
      const sourceCodeUnformatted = createSourceCodeTemplate({ templateInfo: _, templatesRepoDir })
      const sourceCode = params.prettier
        ? Prettier.format(sourceCodeUnformatted, {
            ...prettierConfig,
            parser: 'typescript',
          })
        : sourceCodeUnformatted

      return {
        path: sourceCodePath,
        content: sourceCode,
      }
    })
  )

  fileOutputs.forEach((output) => {
    FS.write(output.path, output.content)
    log.info(`Output file: ${output.path}`)
  })
}

/**
 * Create the module source code for a template.
 */
const createSourceCodeTemplate = (params: {
  templateInfo: TemplateInfo
  templatesRepoDir: string
}): string => {
  const { templateInfo } = params

  const filePaths = glob.sync(`${templateInfo.path}/**/*`, { dot: true })

  const files = filePaths
    .filter((filePath) => !(filePath.endsWith('.png') || filePath.endsWith('.jpeg')))
    .map((filePath) => ({
      path: Path.relative(templateInfo.path, filePath),
      //eslint-disable-next-line
      content: FS.read(filePath)!,
    }))

  const prismaSeedFile = files.find((_) => _.path === 'prisma/seed.ts')

  const filesByPath = files
    .map((f) => {
      // cannot use endent here because it gets messed up by inner endent
      return `'${f.path}': {
  path: '${f.path}' as const,
  content: endent\`
${indentBlock(4, escapeBackticks(f.content))}
\`
}`
    })
    .join(',\n')

  const githubRepoUrl = `https://github.com/prisma/prisma-schema-examples`

  const sourceCode = endent`
      /**
       * This module was generated.
       * 
       * It contains data about the "${templateInfo.displayName}" template.
       */

      // Disable TS type checking because the emitted seed function body otherwise has type errors.
      // Once https://github.com/Microsoft/TypeScript/issues/19573 is shipped we can disable TS 
      // type checking on just the seed function.
      // @ts-nocheck

      import endent from 'endent'
      import { FileTransformer } from '../../fileTransformer'
      import { FileTransformers } from '../../fileTransformers'
      import { MigrationSql } from '../../logic'
      import { Reflector } from '~/src/lib/Reflector'
      import { BaseTemplateParameters, AbstractTemplate } from '../../types'
      import { merge } from 'lodash'

      ${sourceCodeSectionHeader('Metadata')}

      const metadata = {
        /**
         * The template's handles in various forms.
         */
        handles: {
          /**
           * ${templateInfo.handles.kebab.jsdoc}
           */
          kebab: '${templateInfo.handles.kebab.value}',
          /**
           *  ${templateInfo.handles.pascal.jsdoc}
           */
          pascal: '${templateInfo.handles.pascal.value}',
          /**
           *  ${templateInfo.handles.camel.jsdoc}
           */
          camel: '${templateInfo.handles.camel.value}',
          /**
           *  ${templateInfo.handles.upper.jsdoc}
           */
          upper: '${templateInfo.handles.upper.value}',
          /**
           *  ${templateInfo.handles.snake.jsdoc}
           */
          snake: '${templateInfo.handles.snake.value}',
        } as const,
        /**
         * The template's expressive name.
         */
        displayName: '${templateInfo.displayName}' as const,

        /**
         * The GitHub repo URL that this template comes from.
         */
        githubUrl: '${githubRepoUrl}/tree/main/${templateInfo.displayName}',

        /**
         * The template's description.
         */
        description: '${templateInfo.description}',
      }

      ${sourceCodeSectionHeader('Files')}
      
      const files = {
        ${filesByPath}
      }

      ${sourceCodeSectionHeader('Parameters')}

      type TemplateParameters = BaseTemplateParameters

      const templateParameterDefaults: Required<TemplateParameters> = {
        datasourceProvider: Reflector.Schema.DatasourceProviderNormalized._def.values.postgres,
        repositoryOwner: null,
        repositoryHandle: null,
        engineType: null,
        dataproxy: true,
        referentialIntegrity: Reflector.Schema.referentialIntegritySettingValueDefault,
      }

      /**
       * Run the seed script for this template.
       * 
       * @remarks This is a version of the seed script from the template that has been transformed into a runnable parameterized function.
       */
      const seed = ${createSeedFunction({ content: prismaSeedFile?.content ?? '' })}

      ${sourceCodeSectionHeader('Class')}

      /**
       * The "${templateInfo.displayName}" Prisma template.
       *
       * ${templateInfo.description}
       */
      class ${templateInfo.handles.pascal.value} implements AbstractTemplate<typeof files> {

        /**
         * Type brand for discriminant union use-cases.
         */
        static _tag = '${templateInfo.handles.pascal.value}' as const

        /**
         * Template metadata like name, etc.
         */
        static metadata = metadata

        /**
         * Template files indexed by their path on disk. Note that the files on a template class instance can
         * have different contents than the files on template class constructor.
         */
        static files = files

        /**
         * Metadata about the parameters accepted by this template.
         */
        static parameters = {
          defaults: templateParameterDefaults
        }

        static seed = seed

        ${sourceCodeSectionHeader2('Instance Properties')}

        /**
         * Type brand for discriminant union use-cases.
         */
        public _tag = '${templateInfo.handles.pascal.value}' as const

        /**
         * Template metadata like name, etc.
         */
        public metadata = metadata

        public seed = seed

        /**
         * Template files indexed by their path on disk. Note that the files on a template class instance can
         * have different contents than the files on template class constructor.
         */
        public files = files

        /**
         * SQL commands that taken together will put the database into a state reflecting the initial Prisma schema of this template.
         * 
         * This is useful for running migrations in environments where the Prisma Migration engine cannot be used, such as with the Prisma Data Proxy.
         * 
         * This SQL has been statically generated using the Prisma CLI [\`migrate diff\`](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-diff) sub-command. The SQL here is equivalent to the
         * SQL that shows up in _initial prisma migration file_ (e.g. \`./prisma/migrations/20210409125609_init/migration.sql\`) of this template. 
         * 
         * Note that this sequel is influenced by the arguments given to this template such as if referential integrity is enabled or not, and what datasource provider was chosen.
         * 
         * This SQL is split by \`;\` such that it can be executed command-by-command using [Prisma Client's raw database access API](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access).
         * Do this inside a [transaction](https://www.prisma.io/docs/concepts/components/prisma-client/transactions) to keep it atomic.
         */
        public migrationSql: MigrationSql.MigrationSql

        ${sourceCodeSectionHeader2('Constructor')}

        constructor(parameters?: TemplateParameters) {
          const parameters_ = merge({}, templateParameterDefaults, parameters)

          this.migrationSql = MigrationSql.select({
            template: this._tag,
            datasourceProvider: parameters_.datasourceProvider,
            referentialIntegrity: parameters_.referentialIntegrity 
          })

          this.files = FileTransformer.runStack({
            template: this._tag,
            transformers: Object.values(FileTransformers),
            files,
            parameters: parameters_
          })
        }
      }

      ${sourceCodeSectionHeader('Namespace')}

      // /**
      //  * Types belonging to the "${templateInfo.handles.pascal.value}" Prisma template.
      //  */
      namespace ${templateInfo.handles.pascal.value} {
        /**
         * The template's tag.
         */
        export type Tag = '${templateInfo.handles.pascal.value}'

        /**
         * The template's handles.
         */
        export namespace Handles {
          export type Pascal = typeof metadata.handles.pascal
          export type Property = typeof metadata.handles.camel
          export type Slug = typeof metadata.handles.kebab
        }

        /**
         * Template files indexed by their path on disk.
         */
        export type Files = typeof files

        /**
         * Parameters accepted by this template.
         */
        export type Parameters = TemplateParameters
      }

      ${sourceCodeSectionHeader('Exports')}

      export {
        ${templateInfo.handles.pascal.value}
      }
    `

  return sourceCode
}

export default run
