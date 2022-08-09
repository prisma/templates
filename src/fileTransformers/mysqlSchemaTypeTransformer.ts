import { FileTransformer } from '~/src/fileTransformer/fileTransformer'

export const mysqlSchemaTypeTransformer: FileTransformer = (params) => {
  const { file, parameters } = params

  if (parameters.datasourceProvider !== 'mysql') {
    return file.content
  }

  return file.content.replace(/ (String\??)/g, ` $1 @db.Text`)
}
