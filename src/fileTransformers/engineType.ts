import { FileTransformer } from '../fileTransformer/fileTransformer'

export const engineType: FileTransformer = (params) => {
  const { file, parameters, tools } = params

  let content = file.content

  switch (file.path) {
    case 'prisma/schema.prisma':
      if (parameters.engineType) {
        content = tools.replaceContent({
          file,
          pattern: /provider *= *"prisma-client-js"/,
          // eslint-disable-next-line
          replacement: `provider = "prisma-client-js" \n  engineType = "${parameters.engineType}"`,
        })
      }
      break
    case 'package.json':
      if (parameters.engineType === 'dataproxy') {
        content = tools.replaceContent({
          file,
          pattern: /"@prisma\/client": ".+"/,
          replacement: `"@prisma/client": "dataproxy"`,
        })
      }
      break
  }

  return content
}
