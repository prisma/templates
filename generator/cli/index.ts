import downloadTemplatesRepo from './download-templates-repo'
import generateMigrationSql from './generate-migration-sql'
import generateTypeScript from './generate-type-script'
import arg from 'arg'
import FS from 'fs-jetpack'
import Path from 'path'
const args = arg({
  '--download-templates-repo': Boolean,
  '--generate-migration-sql': Boolean,
  '--generate-type-script': Boolean,
})

main().catch((error) => {
  console.log(error)
  process.exit(1)
})

//eslint-disable-next-line
async function main(): Promise<void> {
  const dirName = '.templates-repo'
  const templatesRepoDir = Path.join(__dirname, '../../node_modules', dirName)
  const migrationSqlOutputDir = Path.join(__dirname, '../../src/generatedMigrations')

  if (args['--download-templates-repo']) {
    //eslint-disable-next-line
    downloadTemplatesRepo({ dir: templatesRepoDir })
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
      outputDir: migrationSqlOutputDir,
    })
  }

  if (args['--generate-type-script']) {
    const outputDir = Path.join(__dirname, `../../src/generated`)
    //eslint-disable-next-line
    generateTypeScript({ templatesRepoDir, outputDir })
  }
}
