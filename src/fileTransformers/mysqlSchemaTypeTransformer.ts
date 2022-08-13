import { FileTransformer } from '~/src/fileTransformer/fileTransformer'
import { mysqlSchemaTypeTransformUtil } from '~/src/utils'

export const mysqlSchemaTypeTransformer: FileTransformer = (params) => {
  const { file, parameters } = params

  return mysqlSchemaTypeTransformUtil(file.content, parameters.datasourceProvider)
}
