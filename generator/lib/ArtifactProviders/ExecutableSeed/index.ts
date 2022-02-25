import { ArtifactProvider } from '../types'
import { babelPluginTransformTemplate } from './babel-plugin-transform-template'
import * as Babel from '@babel/core'
import { TemplateInfo } from '~/src/templates'
import { File } from '~/src/types'
import { datasourceUrlEnvironmentVariableName, Index } from '~/src/utils'

export const run: ArtifactProvider = <T extends Index<File>>(params: {
  templateInfo: TemplateInfo
  files: T
}) => {
  const prismaSeedTs = params.files['prisma/seed.ts']

  if (!prismaSeedTs || prismaSeedTs.content === '') return []

  const seedSourceCode = babelTransform({
    templateName: params.templateInfo.handles.kebab.value,
    content: prismaSeedTs.content,
  })

  return [
    {
      path: 'prisma/seed.mjs', // Mark this as an ESM to enable top-level await (which the seed script uses after Babel transform)
      content: seedSourceCode,
    },
  ]
}

const babelTransform = ({ templateName, content }: { templateName: string; content: string }) => {
  // eslint-disable-next-line
  return Babel.transformSync(content, {
    plugins: [
      babelPluginTransformTemplate({
        schema: {
          content: `PRISMA TEMPLATE: ${templateName}`,
          path: '/tmp/schema.prisma',
          datasourceUrlEnvironmentVariableName,
        },
      }), // transform imports
      '@babel/plugin-transform-typescript', // strip types
    ],
  })!.code!
}
