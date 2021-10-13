import { FileTransformer } from '../fileTransformer/fileTransformer'

export const engineType: FileTransformer = (params) => {
  const { file, parameters } = params

  let content = file.content

  if (file.path === 'prisma/schema.prisma') {
    if (parameters.engineType) {
      content = content.replace(
        `provider = "prisma-client-js"`,
        `provider = "prisma-client-js" \n  engineType = "${parameters.engineType}"`
      )
    }
  }
  if (file.path === 'package.json') {
    if (parameters.engineType && parameters.engineType === 'dataproxy') {
      content = content.replace(`"@prisma/client": "latest"`, `"@prisma/client": "dataproxy"`)
    }
  }

  return content
}
