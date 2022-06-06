import { FileTransformer } from '../fileTransformer/fileTransformer'
import { normalizeAutoincrement } from '../utils'

/**
 * When mongodb database provider is being used this will update the prisma client generator block to have the
 * needed preview feature flag enabled.
 *
 * @link https://www.prisma.io/docs/concepts/database-connectors/mongodb#example
 */
export const datasourceProviderCockroachdb: FileTransformer = (params) => {
  const { file, parameters, tools } = params

  if (file.path === 'prisma/schema.prisma') {
    if (parameters.datasourceProvider === 'mongodb') {
      /**
       * When mongodb database provider is being used this will update the prisma client generator block to have the
       * needed preview feature flag enabled.
       *
       * @link https://www.prisma.io/docs/concepts/database-connectors/mongodb#example
       */
      return tools.prismaSchema.addPreviewFeatureFlag({
        file: params.file,
        PreviewFeatureFlag: 'mongoDb',
      })
    } else {
      return normalizeAutoincrement(file.content, parameters.datasourceProvider)
    }
  }

  return file.content
}
