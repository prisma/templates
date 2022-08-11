import { testTemplate } from '~/tests/e2e/__testers__'

testTemplate({
  templateName: 'UrlShortener',
  expectedDevOutput: /Top users \(alphabetical\):/,
  datasourceProvider: 'postgres',
})
