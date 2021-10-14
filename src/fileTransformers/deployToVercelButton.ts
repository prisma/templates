import { FileTransformer } from '../fileTransformer/fileTransformer'

export const deployToVercelButton: FileTransformer = (params) => {
  const { file, parameters } = params

  let content = file.content

  if (parameters.repositoryHandle && parameters.repositoryOwner && file.path === 'README.md') {
    const repository = encodeURIComponent(parameters.repositoryOwner + '/' + parameters.repositoryHandle)
    const envVarName = 'DATABASE_URL'
    const envVarDescription = encodeURIComponent(
      "Connection string for the database this deployment will talk to. If you're using the Prisma Data Proxy, then use its connection string."
    )

    const deployButton = `[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?repository-url=https%3A%2F%2Fgithub.com%2F${repository}&env=${envVarName}&envDescription=${envVarDescription})`

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
