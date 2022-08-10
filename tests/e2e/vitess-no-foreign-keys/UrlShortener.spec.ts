import { testTemplate } from '../__testers__'
import { getDefaultVitessTestConfig } from '~/tests/e2e/helpers/getDefaultVitessTestConfig'

testTemplate({
  ...getDefaultVitessTestConfig('mysql://root:root@localhost:33577'),
  templateName: 'UrlShortener',
  expectedDevOutput: /Top users \(alphabetical\):/,
})
