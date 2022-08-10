import { FileTransformer } from '~/src/fileTransformer/fileTransformer'

/**
 * @description
 * Schema type transform examples:
 *  String? -> String? @db.Text
 *  String -> String @db.Text
 *  String @id -> String
 *  String @unique -> String
 */
export const mysqlSchemaTypeTransformer: FileTransformer = (params) => {
  const { file, parameters } = params

  if (parameters.datasourceProvider !== 'mysql') {
    return file.content
  }

  const regex = / (String\??)(?!.*(?:@unique|@id))/gm
  return file.content.replace(regex, ` $1 @db.Text`)
}
