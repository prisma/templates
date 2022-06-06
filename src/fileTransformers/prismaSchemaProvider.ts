import { FileTransformer } from '../fileTransformer/fileTransformer'
import { Reflector } from '../lib/Reflector'

export const prismaSchemaProvider: FileTransformer = (params) => {
  const { file, parameters } = params

  if (file.path === 'prisma/schema.prisma') {
    return Reflector.Schema.setDatasourceProvider({
      prismaSchemaContent: file.content,
      value: parameters.datasourceProvider,
    })
  }

  return file.content
}
