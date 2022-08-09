import { testTemplate } from '../__testers__'
import { getDefaultPlanetScaleTestTemplateConfig } from '~/tests/e2e/helpers/getDefaultPlanetScaleTestTemplateConfig'

const planetScaleDBURI = process.env.PLANET_SCALE_TEST_DB_URI
console.log('[Debug] PlanetScale', planetScaleDBURI)
if (planetScaleDBURI) {
  testTemplate({
    ...getDefaultPlanetScaleTestTemplateConfig(planetScaleDBURI),
    templateName: 'UrlShortener',
    expectedDevOutput: /Top users \(alphabetical\):/,
  })
} else {
  test.todo('PLANET_SCALE_TEST_DB_URI ENV value is not set.')
  console.warn('PLANET_SCALE_TEST_DB_URI ENV value is not set.')
}
