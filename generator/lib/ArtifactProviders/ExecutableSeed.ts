import { ArtifactProvider } from './types'
import * as swc from '@swc/core'
import { TemplateInfo } from '~/src/templates'
import { File } from '~/src/types'
import { Index } from '~/src/utils'

export const run: ArtifactProvider = <T extends Index<File>>(params: {
  templateInfo: TemplateInfo
  files: T
}) => {
  const prismaSeedScript = params.files['prisma/seed.ts']

  if (!prismaSeedScript || prismaSeedScript.content === '') return []

  const prismaSeedModule = transform({
    content: prismaSeedScript.content,
  })

  return [
    {
      path: 'prisma/seed.js',
      content: prismaSeedModule,
    },
  ]
}

const transform = ({ content }: { content: string }) => {
  let code = content
  code = code.replace(/^.*import +.*@prisma\/client.*$/m, '')
  code = code.replace(/^.*const +prisma += +new +PrismaClient\(\).*$/m, '')
  code = code.replace(/^.*async +function +main\(\)/m, 'export async function run({ prisma })')
  code = code.replace(/^.*main.*\(.*\)\.finally.*\((?:.|\s)*}\)/m, '')
  code = swc.transformSync(code, {
    filename: 'seed.js',
    sourceMaps: false,
    isModule: true,
    jsc: {
      parser: {
        syntax: 'typescript',
      },
      target: 'es2020',
    },
    module: {
      type: 'commonjs',
    },
  }).code
  return code
}
