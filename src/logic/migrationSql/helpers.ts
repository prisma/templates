import { PrismaUtils } from '@prisma/utils'
import { PrismaTemplates } from '~/src'
import { upperFirst } from '~/src/utils'

/**
 * Get the overall name of the migration for the given migration variables.
 */
export const getName = (params: {
  template: PrismaTemplates.$Types.TemplateTag
  datasourceProvider: DatasourceProvidersNormalizedSupportingMigration
  referentialIntegrity: PrismaUtils.Schema.ReferentialIntegritySettingValue
}): MigrationFileName =>
  // prettier-ignore
  `${params.template}With${upperFirst(params.datasourceProvider)}WithReferentialIntegrity${upperFirst(params.referentialIntegrity)}`

export type MigrationSql = string[]

export type DatasourceProvidersNormalizedSupportingMigration = Exclude<
  PrismaUtils.Schema.DatasourceProviderNormalized,
  'mongodb'
>

export type MigrationFileName =
  `${PrismaTemplates.$Types.TemplateTag}With${Capitalize<DatasourceProvidersNormalizedSupportingMigration>}WithReferentialIntegrity${Capitalize<PrismaUtils.Schema.ReferentialIntegritySettingValue>}`
