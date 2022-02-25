import { PrismaUtils } from '@prisma/utils'
import { PrismaTemplates } from '../../'
import { MigrationsSql } from '../../generatedMigrations'
import { BaseTemplateParametersResolved, DatasourceProvider } from '../../types'
import { upperFirst } from '../../utils'

export type MigrationSql = string[]

// export type MigrationRecord = Record<MigrationFileName, MigrationSql>

export type Params = {
  template: PrismaTemplates.$Types.TemplateTag
  parameters: BaseTemplateParametersResolved
}

export const getMigrationName = (params: {
  template: PrismaTemplates.$Types.TemplateTag
  datasourceProvider: DatasourceProvider
  referentialIntegrity: PrismaUtils.Schema.ReferentialIntegritySettingValue
}): MigrationFileName =>
  // prettier-ignore
  `${params.template}With${upperFirst(params.datasourceProvider)}WithReferentialIntegrity${upperFirst(params.referentialIntegrity)}`

export type MigrationFileName =
  `${PrismaTemplates.$Types.TemplateTag}With${Capitalize<DatasourceProvider>}WithReferentialIntegrity${Capitalize<PrismaUtils.Schema.ReferentialIntegritySettingValue>}`

export const select = (params: Params): MigrationSql => {
  if (
    params.parameters.datasourceProvider === 'sqlite' ||
    params.parameters.datasourceProvider === 'mongodb' ||
    params.template === 'Empty'
  ) {
    return []
  }

  return MigrationsSql[
    getMigrationName({
      template: params.template,
      datasourceProvider: params.parameters.datasourceProvider,
      referentialIntegrity: params.parameters.referentialIntegrity,
    })
  ]
}
