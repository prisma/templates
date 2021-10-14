import { Generated } from './generated'

export * as $Types from './types'

export const Templates = Generated.Templates

export const Utils = {
  getVercelDeployButtonUrl(params: {
    repositoryOwner: string
    repositoryHandle: string
    environmentVariableNames: string[]
    environmentVariablesDescription: string
  }) {
    const repository = encodeURIComponent(params.repositoryOwner + '/' + params.repositoryHandle)
    const envVars = params.environmentVariableNames.join(',')
    const envVarDescription = encodeURIComponent(params.environmentVariablesDescription)

    return `https://vercel.com/new/import?repository-url=https%3A%2F%2Fgithub.com%2F${repository}&env=${envVars}&envDescription=${envVarDescription}`
  },
}
