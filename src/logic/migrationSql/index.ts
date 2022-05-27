import { PrismaTemplates } from '../../'
import { MigrationScripts } from '../../generated/migrations'
import { getName } from './helpers'
import { Reflector } from '~/src/lib/Reflector'
export * from './helpers'

export const select = (params: {
  template: PrismaTemplates.$Types.TemplateTag
  datasourceProvider: Reflector.Schema.DatasourceProviderNormalized
  referentialIntegrity: Reflector.Schema.ReferentialIntegritySettingValue
}): string => {
  if (
    params.datasourceProvider === 'sqlite' ||
    params.datasourceProvider === 'mongodb' ||
    params.template === 'Empty'
  ) {
    return ''
  }

  return MigrationScripts[
    // TODO just pass params straight through once TS is smart enough to accept this.
    getName({
      template: params.template,
      datasourceProvider: params.datasourceProvider,
      referentialIntegrity: params.referentialIntegrity,
    })
  ].script
}
