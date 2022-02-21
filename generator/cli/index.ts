import arg from 'arg'
import Path from 'path'
import downloadTemplatesRepo from './download-templates-repo'
import generateTypeScript from './generate-type-script'
import generateMigrationSql from './generate-migration-sql'

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
  const dirName = 'templates-repo'
  const templatesRepoDir = Path.join(__dirname, '../..', dirName)
  const migrationSqlOutputDir = Path.join(__dirname, '../../src/generatedMigrations')
  if (args['--download-templates-repo']) {
    //eslint-disable-next-line
    await downloadTemplatesRepo({ dir: templatesRepoDir })
  }

  if (args['--generate-migration-sql']) {
    await generateMigrationSql({
      templatesRepoDir,
      outputDir: migrationSqlOutputDir,
    })
  }

  if (args['--generate-type-script']) {
    const outputDir = Path.join(__dirname, `../../src/generated`)
    //eslint-disable-next-line
    await generateTypeScript({ templatesRepoDir, outputDir })
  }
}
