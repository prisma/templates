import { FileTransformer } from '~/src/fileTransformer/fileTransformer'

export const mysqlSchemaTypeTransformer: FileTransformer = (params) => {
  const { file, parameters } = params

  if (parameters.datasourceProvider !== 'mysql') {
    return file.content
  }

  /**
   * @description
   * Regex transformation examples:
   * - String? -> String? @db.Text
   * - String -> String @db.Text
   * - String @id -> String
   * - String @unique -> String
   */
  const regex = / (String\??)(?!.*(?:@unique|@id))/gm
  return file.content.replace(regex, ` $1 @db.Text`)
}
