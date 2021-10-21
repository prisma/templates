import { PrismaTemplates } from '~/src'

it('has various data centric helpers', () => {
  expect(PrismaTemplates.$Types).toMatchSnapshot()
})
