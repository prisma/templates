import { FileTransformer } from '../fileTransformer/fileTransformer'

export const prismaSchemaProvider: FileTransformer = (params) => {
  const { file, parameters } = params

  let content = file.content

  if (file.path === 'prisma/schema.prisma') {
    content = content.replace(`provider = "postgresql"`, `provider = "${parameters.datasourceProvider}"`)

    if (parameters.datasourceProvider === 'sqlserver') {
      content = content.replace(
        `provider = "prisma-client-js"`,
        `provider = "prisma-client-js"
  previewFeatures = ["microsoftSqlServer"]`
      )
    }
    console.log({ content })
  }

  return content
}
