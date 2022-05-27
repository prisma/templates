import { FileTransformer } from '../fileTransformer/fileTransformer'

export const prismaSchemaProvider: FileTransformer = (params) => {
  const { file, parameters, tools } = params

  let content = file.content

  if (file.path === 'prisma/schema.prisma') {
    content = tools.replaceContent({
      file,
      pattern: /provider *= *"postgres(?:ql)?"/,
      replacement: `provider = "${parameters.datasourceProvider}"`,
    })
  }

  return content
}
