import { FileTransformer } from '../fileTransformer/fileTransformer'

export const engineType: FileTransformer = (params) => {
  const { file, parameters, tools } = params

  let content = file.content

  if (parameters.engineType) {
    switch (file.path) {
      case 'prisma/schema.prisma':
        content = tools.replaceContent({
          file,
          pattern: /provider *= *"prisma-client-js"/,
          // eslint-disable-next-line
          replacement: `provider = "prisma-client-js"\n  engineType = "${parameters.engineType}"`,
        })
        break
    }
  }

  return content
}
