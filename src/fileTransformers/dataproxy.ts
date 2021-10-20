import { FileTransformer } from '../fileTransformer/fileTransformer'

export const dataproxy: FileTransformer = (params) => {
  const { file, parameters, tools } = params

  let content = file.content

  if (parameters.dataproxy !== false) {
    switch (file.path) {
      case 'prisma/schema.prisma':
        content = tools.prismaSchema.addPreviewFlag({
          file,
          previewFlag: 'dataproxy',
        })
        break
      case 'package.json':
        content = tools.json.merge({
          file,
          data: {
            scripts: {
              'prisma:generate': "PRISMA_CLIENT_ENGINE_TYPE='dataproxy' prisma generate",
              'prisma:migrate': 'DATABASE_URL="$MIGRATE_DATABASE_URL" prisma migrate deploy',
            },
          },
        })
        break
    }
  }

  return content
}
