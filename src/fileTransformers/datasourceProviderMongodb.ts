import { FileTransformer } from '../fileTransformer/fileTransformer'

/**
 * When mongodb database provider is being used this will update the prisma client generator block to have the
 * needed preview feature flag enabled.
 *
 * @link https://www.prisma.io/docs/concepts/database-connectors/mongodb#example
 */
export const datasourceProviderMongodb: FileTransformer = (params) => {
  const { file, parameters, tools } = params

  let content = file.content

  switch (file.path) {
    case 'prisma/schema.prisma':
      if (parameters.datasourceProvider === 'mongodb') {
        content = tools.replaceContent({
          file,
          pattern: /(provider *= *"prisma-client-js")/,
          replacement: `$1\n  previewFeatures = ["mongoDb"]`,
        })
      }
      break
  }

  return content
}
