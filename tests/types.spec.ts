import { PrismaTemplates } from '~/src'

it('has handle data lists', () => {
  expect(PrismaTemplates.$Types.TemplateHandle).toMatchSnapshot()
})
