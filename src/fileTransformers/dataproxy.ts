import { FileTransformer } from '../fileTransformer/fileTransformer'

export const dataproxy: FileTransformer = (params) => {
  const { file, parameters, tools, template } = params

  let content = file.content

  if (parameters.dataproxy) {
    switch (file.path) {
      case 'package.json':
        content = tools.json.merge({
          file,
          data: {
            scripts: {
              build:
                template === 'Nextjs'
                  ? `prisma generate --data-proxy && next build`
                  : `prisma generate --data-proxy`,
            },
          },
        })
        break
    }
  }

  return content
}
