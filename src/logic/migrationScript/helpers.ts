import { PrismaTemplates } from '~/src'
import { Reflector } from '~/src/lib/Reflector'
import { upperFirst } from '~/src/utils'

/**
 * Get the overall name of the migration for the given migration variables.
 */
export const getName = (params: {
  template: PrismaTemplates.$Types.TemplateTag
  datasourceProvider: DatasourceProvidersNormalizedSupportingMigration
  referentialIntegrity: Reflector.Schema.ReferentialIntegritySettingValue
}): MigrationFileName =>
  // prettier-ignore
  `${params.template}With${upperFirst(params.datasourceProvider)}WithReferentialIntegrity${upperFirst(params.referentialIntegrity)}`

export type DatasourceProvidersNormalizedSupportingMigration = Exclude<
  Reflector.Schema.DatasourceProviderNormalized,
  'mongodb'
>

export type MigrationFileName =
  `${PrismaTemplates.$Types.TemplateTag}With${Capitalize<DatasourceProvidersNormalizedSupportingMigration>}WithReferentialIntegrity${Capitalize<Reflector.Schema.ReferentialIntegritySettingValue>}`