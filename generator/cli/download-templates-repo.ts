import execa from 'execa'
import * as FS from 'fs-jetpack'
const log = console.log

export default function (params: { dir: string }): void {
  const { dir } = params

  log(`downloading templates repo source to ${dir}`)

  FS.remove(dir)

  execa.commandSync(`git clone https://github.com/prisma/templates.git ${dir} --depth 1 --branch cloud`)

  FS.remove(`${dir}/.git`)

  log(`done`)
}
