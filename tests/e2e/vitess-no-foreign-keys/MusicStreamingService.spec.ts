import { testTemplate } from '../__testers__'
import { getDefaultVitessTestConfig } from '~/tests/e2e/helpers/getDefaultVitessTestConfig'

testTemplate({
  ...getDefaultVitessTestConfig(),
  templateName: 'MusicStreamingService',
  expectedDevOutput: /Albums that have more than 1 word:/,
})
