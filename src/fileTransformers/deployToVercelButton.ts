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
      `<br/><br/>[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?repository-url=https%3A%2F%2Fgithub.com%2F${encodedURI}&env=DATABASE_URL&envDescription=Connection%20string%20for%20the%20database%20this%20deployment%20will%20talk%20to.%20If%20you're%20using%20the%20Data%20Proxy%2C%20then%20ude%20its%20connection%20string)
      `
    )
  }

  return content
}
