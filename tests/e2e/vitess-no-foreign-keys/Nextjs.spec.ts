import { testTemplate } from '../__testers__'
import { getDefaultPlanetScaleTestTemplateConfig } from '~/tests/e2e/helpers/getDefaultPlanetScaleTestTemplateConfig'

testTemplate({
  ...getDefaultPlanetScaleTestTemplateConfig('mysql://root:root@localhost:33577'),
  templateName: 'Nextjs',
  expectedDevOutput: '',
})
