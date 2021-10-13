import { FileTransformer } from '../fileTransformer/fileTransformer'

export const engineType: FileTransformer = (params) => {
  const { file, parameters } = params

  let content = file.content

  switch (file.path) {
    case 'prisma/schema.prisma':
      if (parameters.engineType) {
        content = content.replace(
          `provider = "prisma-client-js"`,
          // eslint-disable-next-line
          `provider = "prisma-client-js" \n  engineType = "${parameters.engineType}"`
        )
      }
      break
    case 'package.json':
      if (parameters.engineType === 'dataproxy') {
        content = content.replace(/"@prisma\/client": ".+"/, `"@prisma/client": "dataproxy"`)
      }
      break
  }

  return content
}
