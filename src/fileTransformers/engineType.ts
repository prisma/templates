import { FileTransformer } from '../fileTransformer/fileTransformer'

export const engineType: FileTransformer = (params) => {
  const { file, parameters, tools } = params

  let content = file.content

  switch (file.path) {
    case 'prisma/schema.prisma':
      if (parameters.engineType) {
        content = tools.replaceContent({
          file,
          pattern: /provider *= *"prisma-client-js"/,
          // eslint-disable-next-line
          replacement: `provider = "prisma-client-js"\n  engineType = "${parameters.engineType}"`,
        })
      }
      if (parameters.engineType === 'dataproxy') {
        content = tools.prismaSchema.addPreviewFlag({
          file,
          previewFlag: 'dataproxy',
        })
      }
      break
  }

  return content
}
