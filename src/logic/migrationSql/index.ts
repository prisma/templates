import { DatasourceProvider } from '../../types'
import { upperFirst } from '../../utils'
import { PrismaTemplates } from '../../'
import { MigrationsSql } from '../../generatedMigrations'
import { BaseTemplateParametersResolved } from '../../types'
import { PrismaUtils } from '@prisma/utils'

export type MigrationSql = string[]

export type MigrationRecord = Record<MigrationFileName, MigrationSql>
export type MigrationFileName =
  `${PrismaTemplates.$Types.TemplateTag}With${Capitalize<DatasourceProvider>}WithReferentialIntegrity${Capitalize<PrismaUtils.Schema.ReferentialIntegritySettingValue>}`

// const migrationsList: MigrationRecord = migrations

export type Params = {
  template: PrismaTemplates.$Types.TemplateTag
  parameters: BaseTemplateParametersResolved
}

export const select = (params: Params): MigrationSql => {
  if (
    params.parameters.datasourceProvider === 'sqlite' ||
    params.parameters.datasourceProvider === 'mongodb' ||
    params.template === 'Empty'
  ) {
    return []
  }

  return MigrationsSql[
    `${params.template}With${upperFirst(
      params.parameters.datasourceProvider
    )}WithReferentialIntegrity${upperFirst(params.parameters.referentialIntegrity)}`
  ]
}
