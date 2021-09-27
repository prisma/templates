import endent from 'endent'
import glob from 'fast-glob'
import * as FS from 'fs-jetpack'
import { camelCase, startCase, upperFirst } from 'lodash'
import * as Path from 'path'
import { File } from '~/src/types'
import { ArtifactProviders } from '../lib/ArtifactProviders'
import { TemplateInfo } from '../lib/types'
import { escapeBackticks, indentBlock, sourceCodeSectionHeader } from '../lib/utils'

const log = console.log

const templateName = (x: string) => camelCase(x)

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
              ${templateName(_.name)}: Templates.${templateClassName(_.name)}
            `
          })
          .join('\n')}
      }

      export type TemplateParmetersByName = {
        ${templateInfos
          .map((_) => {
            return endent`
              ${templateName(_.name)}: Templates.${templateClassName(_.name)}.Parameters
            `
          })
          .join('\n')}
      }

      export type TemplateClassByName = {
        ${templateInfos
          .map((_) => {
            return endent`
              ${templateName(_.name)}: typeof Templates.${templateClassName(_.name)}
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
              | Templates.${templateClassName(_.name)}.Name
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
  return glob.sync(`${params.templatesRepoDir}/*`, { onlyDirectories: true }).map((path) => ({
    name: templateName(Path.basename(path)),
    displayName: startCase(Path.basename(path)),
    path,
  }))
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

      const metadata = {
        /**
         * The template's name.
         */
        name: '${templateInfo.name}' as const,

        /**
         * The template's expressive name.
         */
        displayName: '${templateInfo.displayName}' as const,

        /**
         * The GitHub repo URL that this template comes from.
         */
        githubUrl: '${githubRepoUrl}/tree/main/${templateInfo.name}',
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
        repositoryOwner: "undefined",
        repositoryHandle: "undefined"
      }

      ${sourceCodeSectionHeader('Class')}

      /**
       * A "${templateInfo.name}" Prisma template.
       */
      class ${templateClassName(
        templateInfo.name
      )} implements AbstractTemplate<typeof metadata.name, typeof files, typeof artifacts> {
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
        export type Name = typeof metadata.name
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
