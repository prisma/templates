import { testTemplate } from '~/tests/e2e/__testers__'
import { getDefaultVitessTestConfig } from '~/tests/e2e/helpers/getDefaultVitessTestConfig'

testTemplate({
  ...getDefaultVitessTestConfig(),
  templateName: 'UrlShortener',
  expectedDevOutput: /Top users \(alphabetical\):/,
})
