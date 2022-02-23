import { DatasourceProvider } from '~/generator/cli/generate-migration-sql'
import { PrismaTemplates } from '../../'
import migrations from '../../generatedMigrations/index'
import { BaseTemplateParametersResolved } from '../../types'

export type MigrationSql = string[]

export type MigrationRecord = Record<MigrationFileName, MigrationSql>
export type MigrationFileName =
  | `${PrismaTemplates.$Types.TemplateTag}${DatasourceProvider}`
  | `${PrismaTemplates.$Types.TemplateTag}${DatasourceProvider}ReferentialIntegrity`

const migrationsList: MigrationRecord = migrations

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
  return migrationsList[
    `${params.template}${params.parameters.datasourceProvider}${
      params.parameters.referentialIntegrity === 'foreignKeys' || !params.parameters.referentialIntegrity
        ? 'ReferentialIntegrity'
        : ''
    }`
  ]
}
