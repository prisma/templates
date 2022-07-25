import { testTemplate } from '../__testers__'
import { getDefaultPlanetScaleTestTemplateConfig } from '~/tests/e2e/helpers/getDefaultPlanetScaleTestTemplateConfig'

const planetScaleDBURI = process.env.PLANET_SCALE_TEST_DB_URI

if (planetScaleDBURI) {
  testTemplate({
    ...getDefaultPlanetScaleTestTemplateConfig(planetScaleDBURI),
    templateName: 'MusicStreamingService',
    expectedDevOutput: /Albums that have more than 1 word:/,
  })
} else {
  test.todo('PLANET_SCALE_TEST_DB_URI ENV value is not set.')
  console.warn('PLANET_SCALE_TEST_DB_URI ENV value is not set.')
}
