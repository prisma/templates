import { testTemplate } from '~/tests/e2e/__testers__'

testTemplate({
  datasourceProvider: 'postgres',
  templateName: 'Saas',
  expectedDevOutput: 'Premium accounts:  [',
})
