import { testTemplate } from '../__testers__'
import { getDefaultPostgresTestTemplateConfig } from '~/tests/e2e/helpers/getDefaultPostgresTestTemplateConfig'

testTemplate({
  ...getDefaultPostgresTestTemplateConfig(),
  templateName: 'Saas',
  expectedDevOutput: 'Premium accounts:  [',
})
