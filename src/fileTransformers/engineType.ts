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
    if (parameters.engineType) {
      content = content.replace(
        `"@prisma/client": "3.1.1"`,
        `"@prisma/client": "3.1.0-integration-data-proxy-engine.1"`
      )
    }
  }

  return content
}
