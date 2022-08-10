import { testTemplate } from '~/tests/e2e/__testers__'
import { getDefaultPostgresTestTemplateConfig } from '~/tests/e2e/helpers/getDefaultPostgresTestTemplateConfig'

testTemplate({
  ...getDefaultPostgresTestTemplateConfig(),
  templateName: 'MusicStreamingService',
  expectedDevOutput: /Albums that have more than 1 word:/,
})
