import generateMigrationScripts from './generate-migration-scripts'
import generateTypeScript from './generate-type-script'
import arg from 'arg'
import FS from 'fs-jetpack'
import Path from 'path'
import { JsonObject } from 'type-fest'
const args = arg({
  '--generate-migration-scripts': Boolean,
  '--generate-type-script': Boolean,
  '--prettier': Boolean,
  '--no-cache': Boolean,
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
  const dirName = 'templates-raw'
  const templatesRepoDir = Path.join(__dirname, '../../', dirName)
  const generatedDir = Path.join(__dirname, `../../src/generated`)

  const cacheKeyFilePath = './node_modules/.cache/reflectTemplatesCacheKey.json'
  const cacheKeyStored = (JSON.parse((await FS.readAsync(cacheKeyFilePath)) || '""') ||
    null) as JsonObject | null
  const result = Execa.sync('./scripts/getReflectTemplatesCacheKey.sh')
  const cacheKeyFresh = JSON.parse(Buffer.from(result.stdout, 'base64').toString('utf-8')) as JsonObject
  const generatedDirExists = FS.exists(generatedDir)
  if (generatedDirExists && isEqual(cacheKeyStored, cacheKeyFresh) && !args['--no-cache']) {
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

  if (args['--generate-migration-scripts']) {
    if (FS.inspect(templatesRepoDir) === undefined) {
      console.log(`${templatesRepoDir} is empty. Should never happen.  Skipping migration generation.`)
      return
    }
    await generateMigrationScripts({
      templatesRepoDir,
      outputDir: Path.join(generatedDir, '/migrations'),
    })
  }

  if (args['--generate-type-script']) {
    await generateTypeScript({
      templatesRepoDir,
      outputDir: generatedDir,
      prettier: args['--prettier'] ?? false,
    })
  }

  if (!isEqual(cacheKeyStored, cacheKeyFresh)) {
    await FS.writeAsync(cacheKeyFilePath, cacheKeyFresh)
  }
}
