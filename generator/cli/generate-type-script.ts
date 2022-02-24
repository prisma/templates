import endent from 'endent'
import glob from 'fast-glob'
import * as FS from 'fs-jetpack'
import { camelCase, snakeCase, upperFirst } from 'lodash'
import * as Path from 'path'
import { File } from '~/src/types'
import { ArtifactProviders } from '../lib/ArtifactProviders'
import { TemplateInfo } from '../lib/types'
import { escapeBackticks, indentBlock, sourceCodeSectionHeader } from '../lib/utils'

const log = console.log

const handleKinds = [`kebab`, `pascal`, `camel`, `snake`, `upper`] as const

/**
 * Generate TypeScript code for templates in given dir.
 */
export default function (params: { templatesRepoDir: string; outputDir: string }): void {
  const { templatesRepoDir, outputDir } = params

  log(`generating type-script code to ${outputDir}`)

  FS.remove(outputDir)

  const templateInfos = getTemplateInfos({ templatesRepoDir })

  log(`Found templates:`, { templates: templateInfos.map((t) => t.displayName) })

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

  fileOutputs.push(
    ...templateInfos.map((_) => {
      const sourceCodePath = Path.join(outputDir, `templates/${_.handles.pascal.value}.ts`)

      return {
        path: sourceCodePath,
        content: createSourceCodeTemplate({ templateInfo: _, templatesRepoDir }),
      }
    })
  )

  fileOutputs.forEach((output) => {
    FS.write(output.path, output.content)
    log(`Output file: ${output.path}`)
  })
}

/**
 * TODO
 */
const getTemplateInfos = (params: { templatesRepoDir: string }): TemplateInfo[] => {
  return glob.sync(`${params.templatesRepoDir}/*`, { onlyDirectories: true, dot: false }).map((path) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { name, description } = require(`${path}/package.json`) as { name: string; description: string }

    const handles = {
      kebab: {
        jsdoc: `Good for URLs, npm package name.`,
        value: name,
      },
      pascal: {
        jsdoc: `Good for class names, type names.`,
        value: upperFirst(camelCase(name)),
      },
      camel: {
        jsdoc: `Good for object properties.`,
        value: camelCase(name),
      },
      snake: {
        jsdoc: `Good for enums, constants.`,
        value: snakeCase(name).toLowerCase(),
      },
      upper: {
        jsdoc: `Good for environment names, constants.`,
        value: snakeCase(name).toUpperCase(),
      },
    }

    return {
      handles,
      displayName: Path.basename(path),
      description,
      path,
    }
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

  const artifacts: File[] = Object.values(ArtifactProviders).reduce((artifacts, artifactProvider) => {
    const newArtifacts = artifactProvider.run({
      templateInfo,
      files: files.reduce((index, file) => {
        return Object.assign(index, { [file.path]: file })
      }, {}),
    })

    return [...artifacts, ...newArtifacts]
  }, [] as File[])

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

  const artifactsByPath = artifacts
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
      import endent from 'endent'
      import { FileTransformer } from '../../fileTransformer'
      import { FileTransformers } from '../../fileTransformers'
      import { PrismaUtils } from '@prisma/utils'
      import { BaseTemplateParameters, AbstractTemplate } from '../../types'

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

      ${sourceCodeSectionHeader('Artifacts')}

      const artifacts = {
        ${artifactsByPath}
      }

      ${sourceCodeSectionHeader('Parameters')}

      type TemplateParameters = BaseTemplateParameters

      const templateParameterDefaults: Required<TemplateParameters> = {
        datasourceProvider: PrismaUtils.Schema.ProviderTypeNormalized._def.values.postgres,
        repositoryOwner: null,
        repositoryHandle: null,
        engineType: null,
        dataproxy: true,
        referentialIntegrity: PrismaUtils.Schema.referentialIntegritySettingValueDefault,
      }

      ${sourceCodeSectionHeader('Class')}

      /**
       * A "${templateInfo.displayName}" Prisma template.
       */
      class ${templateInfo.handles.pascal.value} implements AbstractTemplate<typeof files, typeof artifacts> {

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
         * Derived assets from the template files.
         */
        static artifacts = artifacts

        /**
         * Metadata about the parameters accepted by this template.
         */
        static parameters = {
          defaults: templateParameterDefaults
        }

        //
        // Instance properties
        //

        /**
         * Type brand for discriminant union use-cases.
         */
        public _tag = '${templateInfo.handles.pascal.value}' as const

        /**
         * Template metadata like name, etc.
         */
        public metadata = metadata

        /**
         * Template files indexed by their path on disk. Note that the files on a template class instance can
         * have different contents than the files on template class constructor.
         */
        public files = files

        /**
         * Derived assets from the template files.
         */
        public artifacts = artifacts

        //
        // Constructor
        //

        constructor(parameters: TemplateParameters) {
          const parameters_ = {
            ...templateParameterDefaults,
            ...parameters,
          }

          this.files = FileTransformer.runStack({
            template: this._tag,
            transformers: Object.values(FileTransformers),
            files,
            parameters: parameters_
          })
        }
      }

      ${sourceCodeSectionHeader('Namespace')}

      /**
       * Types belonging to the "${templateInfo.handles.pascal.value}" Prisma template.
       */
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
         * Derived assets from the template files.
         */
        export type Artifacts = typeof artifacts

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
