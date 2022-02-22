import { PrismaTemplates } from '../../'
import migrations from '../../generatedMigrations/index'
import { BaseTemplateParametersResolved } from '../../types'

export type MigrationSqlResponse = string[]

export type Params = {
  template: PrismaTemplates.$Types.TemplateTag
  parameters: BaseTemplateParametersResolved
}

export const select = (params: Params): MigrationSqlResponse => {
  if (
    params.parameters.datasourceProvider === 'sqlite' ||
    params.parameters.datasourceProvider === 'mongodb' ||
    params.template === 'Empty'
  ) {
    return []
  }
  if (params.parameters.datasourceProvider === 'mysql') {
    // Planetscale mode
    if (params.parameters.referentialIntegrity === 'prisma') {
      return migrations[`${params.template}${params.parameters.datasourceProvider}`]
        ?.filter((statement) => !statement.includes('FOREIGN'))
        .map((statement) => statement.replace(/\u0060/g, ''))
    }
    return migrations[`${params.template}mysql`]?.map((statement) => statement.replace(/\u0060/g, ''))
  }

  return migrations[`${params.template}${params.parameters.datasourceProvider}`]
}
