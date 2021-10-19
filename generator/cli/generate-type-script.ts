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

const templateClassName = (x: string) => upperFirst(camelCase(x))

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
              "${_.name}": Templates.${templateClassName(_.name)}
            `
          })
          .join('\n')}
      }

      export type TemplateParmetersByName = {
        ${templateInfos
          .map((_) => {
            return endent`
              "${_.name}": Templates.${templateClassName(_.name)}.Parameters
            `
          })
          .join('\n')}
      }

      export type TemplateClassByName = {
        ${templateInfos
          .map((_) => {
            return endent`
              "${_.name}": typeof Templates.${templateClassName(_.name)}
            `
          })
          .join('\n')}
      }
        
      export type TemplateClass =
        ${templateInfos
          .map((_) => {
            return endent`
              | typeof Templates.${templateClassName(_.name)}
            `
          })
          .join('\n')}

      export type Template =
        ${templateInfos
          .map((_) => {
            return endent`
              | Templates.${templateClassName(_.name)}
            `
          })
          .join('\n')}

      export type TemplateNames =
        ${templateInfos
          .map((_) => {
            return endent`
              | Templates.${templateClassName(_.name)}.Handles.Pascal
            `
          })
          .join('\n')}
    `,
  })

  fileOutputs.push({
    path: Path.join(outputDir, `templates/index.ts`),
    content: endent`
      ${templateInfos
        .map((template) => {
          return `export { ${templateClassName(template.name)} } from './${template.name}'`
        })
        .join('\n')}
    `,
  })

  fileOutputs.push(
    ...templateInfos.map((templateInfo) => {
      const sourceCodePath = Path.join(outputDir, `templates/${templateInfo.name}.ts`)

      return {
        path: sourceCodePath,
        content: createSourceCodeTemplate({ templateInfo, templatesRepoDir }),
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
  return glob.sync(`${params.templatesRepoDir}/*`, { onlyDirectories: true }).map((path) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { name, description } = require(`${path}/package.json`) as { name: string; description: string }

    return {
      name,
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

  const filePaths = glob.sync(`${templateInfo.path}/**/*`)

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

  const handles = {
    kebab: {
      jsdoc: `Good for URLs, publishable to npm, etc.`,
      value: templateInfo.name,
    },
    pascal: {
      jsdoc: `Good for class names, type names, etc. e.g. GraphQL object types.`,
      value: upperFirst(camelCase(templateInfo.name)),
    },
    camel: {
      jsdoc: `Good for object indexes`,
      value: camelCase(templateInfo.name),
    },
    snake: {
      jsdoc: `Good for enums, constants, etc.`,
      value: snakeCase(templateInfo.name).toLowerCase(),
    },
    upper: {
      jsdoc: `Good for environment names, constants, etc.`,
      value: snakeCase(templateInfo.name).toUpperCase(),
    },
  }
  const sourceCode = endent`
      /**
       * This module was generated.
       * 
       * It contains data about the "${templateInfo.name}" template.
       */
      import endent from 'endent'
      import { FileTransformer } from '../../fileTransformer'
      import { FileTransformers } from '../../fileTransformers'
      import { Data } from '../../data'
      import { BaseTemplateParameters, AbstractTemplate } from '../../types'

      ${sourceCodeSectionHeader('Metadata')}

      const handleMap = {
        ${Object.entries(handles)
          .map(([k, item]) => {
            if (k === 'kebab' && handles.kebab.value === handles.camel.value) return null
            if (k === 'snake' && handles.snake.value === handles.camel.value) return null
            return `
            ['${item.value}']: {
              /**
               * ${handles.kebab.jsdoc}
               */
              kebab: '${handles.kebab.value}',
              /**
               *  ${handles.pascal.jsdoc}
               */
              pascal: '${handles.pascal.value}',
              /**
               *  ${handles.camel.jsdoc}
               */
              camel: '${handles.camel.value}',
              /**
               *  ${handles.upper.jsdoc}
               */
              upper: '${handles.upper.value}',
              /**
               *  ${handles.snake.jsdoc}
               */
              snake: '${handles.snake.value}',
            },
          `
          })
          .filter((_) => _ !== null)
          .join('\n')}
      } as const

      const metadata = {
        /**
         * The template's handles in various forms.
         */
        handles: {
          /**
           * ${handles.kebab.jsdoc}
           */
          kebab: '${handles.kebab.value}',
          /**
           *  ${handles.pascal.jsdoc}
           */
          pascal: '${handles.pascal.value}',
          /**
           *  ${handles.camel.jsdoc}
           */
          camel: '${handles.camel.value}',
          /**
           *  ${handles.upper.jsdoc}
           */
          upper: '${handles.upper.value}',
          /**
           *  ${handles.snake.jsdoc}
           */
          snake: '${handles.snake.value}',
        } as const,
        /**
         * The template's expressive name.
         */
        displayName: '${templateInfo.displayName}' as const,

        /**
         * The GitHub repo URL that this template comes from.
         */
        githubUrl: '${githubRepoUrl}/tree/main/${templateInfo.name}',

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
        datasourceProvider: Data.PrismaDatasourceProviderName.postgresql,
        repositoryOwner: null,
        repositoryHandle: null,
        engineType: null
      }

      ${sourceCodeSectionHeader('Class')}

      /**
       * A "${templateInfo.name}" Prisma template.
       */
      class ${templateClassName(
        templateInfo.name
      )} implements AbstractTemplate<typeof files, typeof artifacts> {
        /**
         * Convert between metadata handle formats in a type-safe way.
         */
        static handleMap = handleMap
        /**
         * Template metadata like name, etc.
         */
        static metadata = metadata
        /**
         * Template files indexed by thier path on disk. Note that the files on a template class instance can
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
         * Template metadata like name, etc.
         */
        public metadata = metadata
        /**
         * Template files indexed by thier path on disk. Note that the files on a template class instance can
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

          this.files = FileTransformer.runStack(Object.values(FileTransformers), files, parameters_)
        }
      }

      ${sourceCodeSectionHeader('Namespace')}

      /**
       * Types belonging to the "${templateInfo.name}" Prisma template.
       */
      namespace ${templateClassName(templateInfo.name)} {
        /**
         * The template's name.
         */
        export namespace Handles {
          export type Pascal = typeof metadata.handles.pascal
          export type Property = typeof metadata.handles.camel
          export type Slug = typeof metadata.handles.kebab
        }
        /**
         * Template files indexed by thier path on disk.
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
        ${templateClassName(templateInfo.name)}
      }
    `

  return sourceCode
}
