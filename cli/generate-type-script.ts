// import * as Babel from '@babel/core'
import endent from 'endent'
import glob from 'fast-glob'
import * as FS from 'fs-jetpack'
import { camelCase, range, startCase } from 'lodash'
import * as Path from 'path'
import { File } from '~/src/types'

const log = console.log

type TemplateInfo = {
  name: string
  displayName: string
  path: string
}

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
    ...templateInfos.map((template) => {
      const sourceCodePath = Path.join(outputDir, `${template.name}.ts`)

      return {
        path: sourceCodePath,
        content: createSourceCodeTemplate({ template, templatesRepoDir }),
      }
    })
  )

  fileOutputs.forEach((output) => {
    FS.write(output.path, output.content)
    log(`Output file: ${output.path}`)
  })
}

const getTemplateInfos = (params: { templatesRepoDir: string }): TemplateInfo[] => {
  return glob.sync(`${params.templatesRepoDir}/*`, { onlyDirectories: true }).map((path) => ({
    name: camelCase(Path.basename(path)),
    displayName: startCase(Path.basename(path)),
    path,
  }))
}

const createSourceCodeIndex = (): string => {
  return endent`
    export * as Generated from './index_'
  `
}

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
const createSourceCodeTemplate = (params: { template: TemplateInfo; templatesRepoDir: string }): string => {
  const { template } = params

  const filePaths = glob.sync(`${template.path}/**/*`)

  const files = filePaths
    .filter((filePath) => !(filePath.endsWith('.png') || filePath.endsWith('.jpeg')))
    .map((filePath) => ({
      path: Path.relative(template.path, filePath),
      //eslint-disable-next-line
      content: FS.read(filePath)!,
    }))

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

  // const artifactsByPath = files
  //   .map((_) => {
  //     if (_.path === 'prisma/seed.ts' && _.content) {
  //       const seedSourceCode = babelTransformSeed({
  //         templateName: template.id,
  //         content: _.content,
  //         templatesRepoDir,
  //       })

  //       return endent`
  //         'prisma/seed.js': {
  //           path: 'prisma/seed.js' as const,
  //           content: endent\`
  //             ${escapeBackticks(seedSourceCode)}
  //           \`
  //         }
  //       `
  //     }
  //     return null
  //   })
  //   .filter((a) => a !== null)
  //   .join(',\n')

  const sourceCode = endent`
      /**
       * This module was generated.
       * 
       * It contains data about the "${template.name}" template.
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
        name: '${template.name}' as const,

        /**
         * The template's expressive name.
         */
        displayName: '${template.displayName}' as const,

        /**
         * The GitHub repo URL that this template comes from.
         */
        githubUrl: '${githubRepoUrl}/tree/main/${template.name}',
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
      }

      export type Artifacts = typeof artifacts

      ${sourceCodeSectionHeader('Parameters')}

      declare global {
        interface GlobalPrismaTemplateParameters {
          ${template.name}: Parameters
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

/**
 * Source code helper for building nice separations between code sections
 */
function sourceCodeSectionHeader(name: string): string {
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
function escapeBackticks(s: string) {
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
const indentBlock = (size: number, block: string): string => {
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

// /**
//  * TODO
//  */
// const babelTransformSeed = (params: { templateName: string; content: string; templatesRepoDir: string }) => {
//   const { templateName, content, templatesRepoDir } = params

//   // eslint-disable-next-line
//   return Babel.transformSync(content, {
//     plugins: [
//       babelPluginTransformTemplate({
//         schema: {
//           content: setSchemaDatasourceUrlEnvarName(
//             Path.resolve(templatesRepoDir, templateName, 'prisma/schema.prisma'),
//             datasourceUrlEnvironmentVariableName
//           ),
//           path: '/tmp/schema.prisma',
//           datasourceEnvVarName: datasourceUrlEnvironmentVariableName,
//         },
//       }), // transform imports
//       '@babel/plugin-transform-typescript', // strip types
//       '@babel/plugin-transform-modules-commonjs', // convert ES imports to CommonJS so it is executable in plain Node
//     ],
//   })!.code!
// }
