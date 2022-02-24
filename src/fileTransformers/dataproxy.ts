import { FileTransformer } from '../fileTransformer/fileTransformer'

export const dataproxy: FileTransformer = (params) => {
  const { file, parameters, tools, template } = params

  let content = file.content

  if (parameters.dataproxy) {
    switch (file.path) {
      case 'prisma/schema.prisma':
        content = tools.prismaSchema.addPreviewFlag({
          file,
          previewFlag: 'dataProxy',
        })
        break
      case 'package.json':
        content = tools.json.merge({
          file,
          data: {
            scripts: {
              build:
                template === 'Nextjs'
                  ? `PRISMA_CLIENT_ENGINE_TYPE='dataproxy' prisma generate && next build`
                  : `PRISMA_CLIENT_ENGINE_TYPE='dataproxy' prisma generate`,
            },
          },
        })
        break
    }
  }

  return content
}
