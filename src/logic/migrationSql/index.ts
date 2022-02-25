import { PrismaUtils } from '@prisma/utils'
import { DatasourceProviderNormalized } from '@prisma/utils/dist-cjs/Schema'
import { PrismaTemplates } from '../../'
import { MigrationsSql } from '../../generatedMigrations'
import { upperFirst } from '../../utils'

export type MigrationSql = string[]

export type DatasourceProvidersNormalizedSupportingMigration = Exclude<
  PrismaUtils.Schema.DatasourceProviderNormalized,
  'mongodb'
>

export type MigrationFileName =
  `${PrismaTemplates.$Types.TemplateTag}With${Capitalize<DatasourceProvidersNormalizedSupportingMigration>}WithReferentialIntegrity${Capitalize<PrismaUtils.Schema.ReferentialIntegritySettingValue>}`

export const getName = (params: {
  template: PrismaTemplates.$Types.TemplateTag
  datasourceProvider: DatasourceProvidersNormalizedSupportingMigration
  referentialIntegrity: PrismaUtils.Schema.ReferentialIntegritySettingValue
}): MigrationFileName =>
  // prettier-ignore
  `${params.template}With${upperFirst(params.datasourceProvider)}WithReferentialIntegrity${upperFirst(params.referentialIntegrity)}`

export const select = (params: {
  template: PrismaTemplates.$Types.TemplateTag
  datasourceProvider: DatasourceProviderNormalized
  referentialIntegrity: PrismaUtils.Schema.ReferentialIntegritySettingValue
}): MigrationSql => {
  if (
    params.datasourceProvider === 'sqlite' ||
    params.datasourceProvider === 'mongodb' ||
    params.template === 'Empty'
  ) {
    return []
  }

  return MigrationsSql[
    // TODO just pass params straight through once TS is smart enough to accept this.
    getName({
      template: params.template,
      datasourceProvider: params.datasourceProvider,
      referentialIntegrity: params.referentialIntegrity,
    })
  ]
}
