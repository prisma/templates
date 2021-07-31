import execa from 'execa'
import * as FS from 'fs-jetpack'
const log = console.log

export default async function (params: { dir: string }) {
  const { dir } = params

  log(`downloading templates repo source to ${dir}`)

  FS.remove(dir)

  execa.commandSync(
    `git clone https://github.com/prisma/prisma-schema-examples.git ${dir} --depth 1 --branch cloud`
  )

  FS.remove(`${dir}/.git`)

  log(`done`)
}
