import { FileTransformer } from '~/src/fileTransformer/fileTransformer'
import { mysqlSchemaTypeTransformUtil } from '~/src/utils'

export const mysqlSchemaTypeTransformer: FileTransformer = (params) =>
  params.file.path.includes('schema.prisma')
    ? mysqlSchemaTypeTransformUtil(params.parameters.datasourceProvider)(params.file.content)
    : params.file.content
