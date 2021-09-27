import { FileTransformer } from '../fileTransformer/fileTransformer'

export const deployToVercelButton: FileTransformer = (params) => {
  const { file, parameters } = params

  let content = file.content

  if (
    parameters.repositoryHandle !== 'undefined' &&
    parameters.repositoryOwner !== 'undefined' &&
    file.path === 'README.md'
  ) {
    const encodedURI = encodeURI(parameters.repositoryOwner + '/' + parameters.repositoryHandle)
    content = content.concat(
      `<br/><br/>[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?repository-url=https%3A%2F%2Fgithub.com%2F${encodedURI})
      `
    )
  }

  return content
}
