import execa from 'execa'
import { log as rootLog } from 'floggy'
import * as FS from 'fs-jetpack'
const log = rootLog.child('downloadTemplatesRepo')

export default function (params: { dir: string }): void {
  const { dir } = params

  log.info(`downloading templates repo source`, { dir })

  FS.remove(dir)

  execa.commandSync(`git clone https://github.com/prisma/templates.git ${dir} --depth 1`)

  FS.remove(`${dir}/.git`)

  log.info(`done`)
}
