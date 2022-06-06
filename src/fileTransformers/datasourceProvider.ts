import { FileTransformer } from '../fileTransformer/fileTransformer'
import { Reflector } from '../lib/Reflector'
import { normalizeAutoincrement } from '../utils'
import { pipe } from 'remeda'

/**
 * When mongodb database provider is being used this will update the prisma client generator block to have the
 * needed preview feature flag enabled.
 *
 * @link https://www.prisma.io/docs/concepts/database-connectors/mongodb#example
 */
export const datasourceProviderCockroachdb: FileTransformer = (params) => {
  const { file, parameters } = params

  if (file.path === 'prisma/schema.prisma') {
    return pipe(
      file.content,
      (prismaSchemaContent) =>
        Reflector.Schema.setDatasourceProvider({
          prismaSchemaContent,
          value: parameters.datasourceProvider,
        }),
      (prismaSchemaContent) =>
        parameters.datasourceProvider === 'mongodb'
          ? /**
             * When mongodb database provider is being used this will update the prisma client generator block to have the
             * needed preview feature flag enabled.
             *
             * @link https://www.prisma.io/docs/concepts/database-connectors/mongodb#example
             */
            Reflector.Schema.addPreviewFeatureFlag({
              prismaSchemaContent,
              previewFlag: 'mongoDb',
            })
          : prismaSchemaContent,

      (prismaSchemaContent) => normalizeAutoincrement(prismaSchemaContent, parameters.datasourceProvider)
    )
  }

  return file.content
}
