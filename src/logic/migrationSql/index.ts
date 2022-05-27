import { PrismaTemplates } from '../../'
import { MigrationsSql } from '../../generated/migrations'
import { getName, Statements } from './helpers'
import { Reflector } from '~/src/lib/Reflector'
export * from './helpers'

export const select = (params: {
  template: PrismaTemplates.$Types.TemplateTag
  datasourceProvider: Reflector.Schema.DatasourceProviderNormalized
  referentialIntegrity: Reflector.Schema.ReferentialIntegritySettingValue
}): Statements => {
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
