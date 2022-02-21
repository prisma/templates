import { PrismaTemplates } from '../'
import { BaseTemplateParametersResolved } from '../types'
import migrations from '../generatedMigrations/index'
export type MigrationSql = string[]

export type Params = {
  template: PrismaTemplates.$Types.TemplateTag
  parameters: BaseTemplateParametersResolved
}

export const selectSql = (params: Params): MigrationSql => {
  let index = `${params.template}${params.parameters.datasourceProvider}`
  return (migrations as any)[index] ?? []
}
