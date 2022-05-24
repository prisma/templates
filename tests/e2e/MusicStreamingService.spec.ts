import { testTemplate } from './__testers__'

testTemplate({
  templateName: 'MusicStreamingService',
  expectedDevOutput: /Albums that have more than 1 word:/,
})
