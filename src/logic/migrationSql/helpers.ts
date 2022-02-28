import { PrismaTemplates } from '~/src'
import { upperFirst } from '~/src/utils'

import { PrismaUtils } from '@prisma/utils'

/**
 * Get the overall name of the migration for the given migration variables.
 */
export const getName = (params: {
  template: PrismaTemplates.$Types.TemplateTag
  datasourceProvider: PrismaUtils.Schema.ProviderTypeNormalized
  referentialIntegrity: PrismaUtils.Schema.ReferentialIntegritySettingValue
}): MigrationFileName => {
  const name = PrismaUtils.Schema.normalizeProviderType(
    params.datasourceProvider
  ) as DatasourceProvidersNormalizedSupportingMigration // We don't access mongodb migration files because there are none generated.
  // prettier-ignore
  return `${params.template}With${upperFirst(name)}WithReferentialIntegrity${upperFirst(params.referentialIntegrity)}`
}
export type MigrationSql = string[]

export type DatasourceProvidersNormalizedSupportingMigration = Exclude<
  PrismaUtils.Schema.ProviderTypeNormalized,
  'mongodb' | 'postgres'
>

export type MigrationFileName =
  `${PrismaTemplates.$Types.TemplateTag}With${Capitalize<DatasourceProvidersNormalizedSupportingMigration>}WithReferentialIntegrity${Capitalize<PrismaUtils.Schema.ReferentialIntegritySettingValue>}`
