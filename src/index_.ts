import { Generated } from './generated'

export * as $Types from './types'

export const Templates = Generated.Templates

export const Utils = {
  getVercelDeployButtonUrl(params: { repositoryOwner: string; repositoryHandle: string }) {
    const repository = encodeURIComponent(params.repositoryOwner + '/' + params.repositoryHandle)
    const envVars = ['DATABASE_URL', 'DATABASE_MIGRATE_URL'].join(',')
    const envVarDescription = encodeURIComponent(
      "Connection string for the database this deployment will talk to. If you're using the Prisma Data Proxy, then use its connection string."
    )

    return `https://vercel.com/new/import?repository-url=https%3A%2F%2Fgithub.com%2F${repository}&env=${envVars}&envDescription=${envVarDescription}`
  },
}
