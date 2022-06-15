import { Generated } from './generated'

export * as $Types from './types'

export const Templates = Generated.Templates

export const Utils = {
  getVercelDeployButtonUrl(params: {
    repositoryOwner: string
    repositoryHandle: string
    /**
     * If enabled an environment variable required for generating a correct runtime dataproxy will be added to
     * the the Vercel button.
     *
     * @link https://www.prisma.io/docs/concepts/components/prisma-data-platform#step-4-regenerate-the-client
     */
    dataproxy: boolean
  }) {
    const repository = encodeURIComponent(params.repositoryOwner + '/' + params.repositoryHandle)
    const envVars = [
      'DATABASE_URL',
      'DATABASE_MIGRATE_URL',
      // @see https://github.com/prisma/prisma/releases/tag/3.15.2
      ...(params.dataproxy ? ['PRISMA_GENERATE_DATAPROXY'] : []),
    ].join(',')
    const envVarDescription = encodeURIComponent(
      'Database connection strings your app depends on. You should switch back to the Prisma Data Platform to figure out what values to input here.'
    )

    return `https://vercel.com/new/import?repository-url=https%3A%2F%2Fgithub.com%2F${repository}&env=${envVars}&envDescription=${envVarDescription}`
  },
}
