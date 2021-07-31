// import * as Babel from '@babel/core'
import endent from 'endent'
import glob from 'fast-glob'
import * as FS from 'fs-jetpack'
import { camelCase, startCase } from 'lodash'
import * as Path from 'path'
import { File } from '~/src/types'
import { ArtifactProviders } from '../lib/ArtifactProviders'
import { TemplateInfo } from '../lib/types'
import { escapeBackticks, indentBlock, sourceCodeSectionHeader } from '../lib/utils'

const log = console.log

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
    content: createSourceCodeIndex(),
  })

  fileOutputs.push({
    path: Path.join(outputDir, `index_.ts`),
    content: createSourceCodeBarrel(templateInfos),
  })

  fileOutputs.push(
    ...templateInfos.map((templateInfo) => {
      const sourceCodePath = Path.join(outputDir, `${templateInfo.name}.ts`)

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
    name: camelCase(Path.basename(path)),
    displayName: startCase(Path.basename(path)),
    path,
  }))
}

/**
 * TODO
 */
const createSourceCodeIndex = (): string => {
  return endent`
    export * as Generated from './index_'
  `
}

/**
 * TODO
 */
const createSourceCodeBarrel = (templateInfos: TemplateInfo[]): string => {
  return endent`
      ${templateInfos
        .map((template) => {
          return `export * as ${template.name} from './${template.name}'`
        })
        .join('\n')}
    `
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
      import { Data } from '../Data'
      import { BaseTemplateParameters } from '../types'

      ${sourceCodeSectionHeader('Metadata')}

      /**
       * Template metadata like name, etc.
       */
      export const metadata = {
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

      /**
       * Template metadata like name, etc.
       */
      export namespace Metadata {
        /**
         * The template's name.
         */
        export type Name = typeof metadata.name
      }  

      ${sourceCodeSectionHeader('Files')}
      
      /**
       * Template files indexed by thier path on disk.
       */
      export const files = {
        ${filesByPath}
      }
      
      /**
       * Template files indexed by thier path on disk.
       */
      export type Files = typeof files

      ${sourceCodeSectionHeader('Artifacts')}

      export const artifacts = {
        ${artifactsByPath}
      }

      export type Artifacts = typeof artifacts

      ${sourceCodeSectionHeader('Parameters')}

      declare global {
        interface GlobalPrismaTemplateParameters {
          ${templateInfo.name}: Parameters
        }
      }


      export type Parameters = BaseTemplateParameters & {}

      export const Parameters: { defaults: Required<Parameters> } = {
        defaults: {
          datasourceProvider: Data.PrismaDatasourceProviderName.postgresql
        }
      }
    `

  return sourceCode
}
