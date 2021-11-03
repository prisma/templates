import { Data } from '../data'
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
    parameters.referentialIntegrity !== Data.referentialIntegritySettingValueDefault &&
    file.path === 'prisma/schema.prisma'
  ) {
    content = tools.prismaSchema.addPreviewFlag({
      file: params.file,
      previewFlag: Data.PreviewFlag.referentialIntegrity,
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
