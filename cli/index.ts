import arg from 'arg'
import Path from 'path'
import downloadTemplatesRepo from './download-templates-repo'
import generateTypeScript from './generate-type-script'

const args = arg({
  '--download-templates-repo': Boolean,
  '--generate-type-script': Boolean,
})

main()

async function main() {
  const dirName = 'templates-repo'
  const templatesRepoDir = Path.join(__dirname, '..', dirName)

  if (args['--download-templates-repo']) {
    await downloadTemplatesRepo({ dir: templatesRepoDir })
  }

  if (args['--generate-type-script']) {
    const outputDir = Path.join(__dirname, `../src/generated`)
    await generateTypeScript({ templatesRepoDir, outputDir })
  }
}
