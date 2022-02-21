import { PrismaTemplates } from '../'
import migrations from '../generatedMigrations/index'
import { BaseTemplateParametersResolved } from '../types'

export type MigrationSql = string[]

export type Params = {
  template: PrismaTemplates.$Types.TemplateTag
  parameters: BaseTemplateParametersResolved
}

export const selectSql = (params: Params): MigrationSql => {
  const index = `${params.template}${params.parameters.datasourceProvider}`
  return (migrations as any)[index] ?? []
}
