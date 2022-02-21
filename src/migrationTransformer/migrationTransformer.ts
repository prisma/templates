import fs from 'fs-jetpack'
import Path from 'path'
import { PrismaTemplates } from '../'
import { Data } from '../data'
import { BaseTemplateParametersResolved } from '../types'

export type MigrationSql = string[]

export type Params = {
  template: PrismaTemplates.$Types.TemplateTag
  parameters: BaseTemplateParametersResolved
}

export const selectSql = (params: Params): MigrationSql => {
  return splitSql(safeRead(params.template, params.parameters.datasourceProvider))
}

const splitSql = (content?: string): MigrationSql => {
  return content ? content.trim().split(';') : []
}

function safeRead(
  template: PrismaTemplates.$Types.TemplateTag,
  provider: Data.DatasourceProviderName
): string | undefined {
  const path = Path.join(__dirname, `../generated/migrations/${template}/${provider}/migration.sql`)
  return fs.read(path)
}
