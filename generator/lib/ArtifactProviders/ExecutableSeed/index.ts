import * as Babel from '@babel/core'
import { datasourceUrlEnvironmentVariableName } from '../../utils'
import { ArtifactProvider } from '../types'
import { babelPluginTransformTemplate } from './babel-plugin-transform-template'

export const run: ArtifactProvider = (params) => {
  const prismaSeedTs = params.files['prisma/seed.ts']

  if (!prismaSeedTs || prismaSeedTs.content === '') return []

  const seedSourceCode = babelTransform({
    templateName: params.templateInfo.name,
    content: prismaSeedTs.content,
  })

  return [
    {
      path: 'prisma/seed.js',
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
      '@babel/plugin-transform-modules-commonjs', // convert ES imports to CommonJS so it is executable in plain Node
    ],
  })!.code!
}
