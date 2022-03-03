import { Reflector } from '@prisma-spectrum/reflector'
import { FileTransformer } from '../fileTransformer/fileTransformer'

/**
 * Handle setting the referential integrity of the datasource.
 *
 * This handles setting the preview flag as well.
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
 */
export const datasourceReferentialIntegrity: FileTransformer = (params) => {
  const { file, parameters, tools } = params

  let content = file.content

  if (
    parameters.referentialIntegrity &&
    parameters.referentialIntegrity !== Reflector.Schema.referentialIntegritySettingValueDefault &&
    file.path === 'prisma/schema.prisma'
  ) {
    content = tools.prismaSchema.addPreviewFeatureFlag({
      file: params.file,
      PreviewFeatureFlag: Reflector.Schema.PreviewFeatureFlag.referentialIntegrity,
    })

    content = tools.prismaSchema.setReferentialIntegrity({
      file: {
        ...file,
        content,
      },
      value: parameters.referentialIntegrity,
    })
  }

  return content
}
