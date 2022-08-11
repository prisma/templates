import { testTemplate } from '../__testers__'
import { getDefaultVitessTestConfig } from '~/tests/e2e/helpers/getDefaultVitessTestConfig'

testTemplate({
  ...getDefaultVitessTestConfig(),
  templateName: 'RentalsPlatform',
  expectedDevOutput: /Expensive reservations:/,
})
