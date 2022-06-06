import { PrismaTemplates } from '~/src'
import { Reflector } from '~/src/lib/Reflector'
import { upperFirst } from '~/src/utils'
import { omit } from 'lodash'
import { z } from 'zod'

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

export const DatasourceProvidersNormalizedSupportingMigration = z.nativeEnum(
  omit(Reflector.Schema.DatasourceProviderNormalized.enum, ['mongodb'])
)

export type DatasourceProvidersNormalizedSupportingMigration = z.infer<
  typeof DatasourceProvidersNormalizedSupportingMigration
>

export type MigrationFileName =
  `${PrismaTemplates.$Types.TemplateTag}With${Capitalize<DatasourceProvidersNormalizedSupportingMigration>}WithReferentialIntegrity${Capitalize<Reflector.Schema.ReferentialIntegritySettingValue>}`
