import downloadTemplatesRepo from './download-templates-repo'
import generateMigrationSql from './generate-migration-sql'
import generateTypeScript from './generate-type-script'
import arg from 'arg'
import FS from 'fs-jetpack'
import Path from 'path'
import { JsonObject } from 'type-fest'
const args = arg({
  '--download-templates-repo': Boolean,
  '--generate-migration-sql': Boolean,
  '--generate-type-script': Boolean,
})
import * as Execa from 'execa'
import { log } from 'floggy'
import { isEqual } from 'lodash'

const moduleLog = log.child('generator')

main().catch((error) => {
  console.log(error)
  process.exit(1)
})

//eslint-disable-next-line
async function main(): Promise<void> {
  const dirName = '.templates-repo'
  const templatesRepoDir = Path.join(__dirname, '../../node_modules', dirName)
  const generatedDir = Path.join(__dirname, `../../src/generated`)

  if (args['--download-templates-repo']) {
    downloadTemplatesRepo({ dir: templatesRepoDir })
  }

  const cacheKeyFilePath = './node_modules/.cache/reflectTemplatesCacheKey.json'
  const cacheKeyStored = (JSON.parse((await FS.readAsync(cacheKeyFilePath)) || '""') ||
    null) as JsonObject | null
  const result = Execa.sync('./scripts/getReflectTemplatesCacheKey.sh')
  const cacheKeyFresh = JSON.parse(result.stdout) as JsonObject
  const generatedDirExists = FS.exists(generatedDir)
  if (generatedDirExists && isEqual(cacheKeyStored, cacheKeyFresh)) {
    moduleLog.warn('cache_hit', {
      message: `delete ${generatedDir} or ${cacheKeyFilePath} to force refresh`,
    })
    return
  } else {
    moduleLog.warn('cache_miss', {
      generatedFilesMissing: !generatedDirExists,
      cacheKeyStored,
      cacheKeyFresh,
    })
  }

  if (args['--generate-migration-sql']) {
    if (FS.inspect(templatesRepoDir) === undefined) {
      console.log(
        `${templatesRepoDir} is empty. Please run build:gen:download-templates-repo.  Skipping migration generation.`
      )
      return
    }
    await generateMigrationSql({
      templatesRepoDir,
      outputDir: Path.join(generatedDir, '/migrations'),
    })
  }

  if (args['--generate-type-script']) {
    generateTypeScript({ templatesRepoDir, outputDir: generatedDir })
  }

  if (!isEqual(cacheKeyStored, cacheKeyFresh)) {
    await FS.writeAsync(cacheKeyFilePath, cacheKeyFresh)
  }
}
