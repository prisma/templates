import { FileTransformer } from '~/src/fileTransformer/fileTransformer'
import { mysqlSchemaTypeTransformUtil } from '~/src/utils'

export const mysqlSchemaTypeTransformer: FileTransformer = (params) =>
  mysqlSchemaTypeTransformUtil(params.parameters.datasourceProvider)(params.file.content)
