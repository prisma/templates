import { PrismaTemplates } from '../'
import { FileTransformer } from '../fileTransformer/fileTransformer'

export const deployToVercelButton: FileTransformer = (params) => {
  const { file, parameters } = params

  let content = file.content

  if (parameters.repositoryHandle && parameters.repositoryOwner && file.path === 'README.md') {
    const deployButtonUrl = PrismaTemplates.Utils.getVercelDeployButtonUrl({
      repositoryOwner: parameters.repositoryOwner,
      repositoryHandle: parameters.repositoryHandle,
      dataproxy: parameters.engineType === 'dataproxy',
    })

    const deployButton = `[![Deploy with Vercel](https://vercel.com/button)](${deployButtonUrl})`

    // Assume the first line of the file is the title, skip over it
    const firstLineBreakIndex = content.split('\n')[0]?.length || 0

    // Add a deploy button after the title
    content = [
      ...content.slice(0, firstLineBreakIndex + 1),
      `${deployButton}<br />`,
      ...content.slice(firstLineBreakIndex),
    ].join('')
  }

  return content
}
