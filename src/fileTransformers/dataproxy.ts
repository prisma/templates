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
              // Note: the following assumes the deployment platform will be Vercel. Once that is variable, the following should only apply to Vercel.
              // This is a workaround/hack for https://prisma-company.slack.com/archives/C02FZENHD4N/p1655248277955299?thread_ts=1655227003.495459&cid=C02FZENHD4N.
              postinstall: `bash -c 'if [ "$VERCEL" != "" ]; then prisma generate --data-proxy; fi'`,
            },
          },
        })
        break
    }
  }

  return content
}
