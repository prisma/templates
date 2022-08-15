import { testTemplate } from '~/tests/e2e/__testers__'

testTemplate({
  datasourceProvider: 'postgres',
  templateName: 'MusicStreamingService',
  expectedDevOutput: /Albums that have more than 1 word:/,
})
