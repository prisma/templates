import { testTemplate } from '~/tests/e2e/__testers__'

testTemplate({
  templateName: 'Empty',
  expectedDevOutput: '',
  datasourceProvider: 'postgres',
})
