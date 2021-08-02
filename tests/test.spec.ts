import { PrismaTemplates } from '~/src'

it('template can have datasourceProivder customized', () => {
  const template = new PrismaTemplates.Templates.Saas({
    datasourceProvider: 'mysql',
  })

  expect(template).toMatchSnapshot()
})
