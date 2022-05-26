import * as swc from '@swc/core'

export const createSeedFunction = ({ content }: { content: string }) => {
  let code = content
  code = code.replace(/^.*import +.*@prisma\/client.*$/m, '')
  code = code.replace(/^.*const +prisma += +new +PrismaClient\(\).*$/m, '')
  code = swc.transformSync(code, {
    filename: 'seed.js',
    sourceMaps: false,
    isModule: true,
    jsc: {
      parser: {
        syntax: 'typescript',
      },
      target: 'es2020',
    },
    module: {
      type: 'commonjs',
    },
  }).code
  code = code.replace(/^.*main.*\(.*\)\.finally.*\((?:.|\s)*}\)/m, 'return main()')
  code = `async ({ prisma }: { prisma: Client.ClientBase }) => {\n\n${code}\n\n}`
  code = code.replace(/"use strict";/, '')
  code = code.replace(/_interopRequireDefault\(obj\)/, '_interopRequireDefault(obj: any)')

  // Music Streaming Service
  code = code.replace(/\({.*id.*}\)/, '({ id }: any)')

  return code
}
