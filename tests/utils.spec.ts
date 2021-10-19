import { PrismaTemplates } from '~/src'

describe('getVercelDeployButtonUrl', () => {
  it('dataproxy enabled', () => {
    expect(
      PrismaTemplates.Utils.getVercelDeployButtonUrl({
        dataproxy: true,
        repositoryOwner: 'some-repo-owner',
        repositoryHandle: 'some-repo',
      })
    ).toMatchSnapshot()
  })
  it('dataproxy disabled', () => {
    expect(
      PrismaTemplates.Utils.getVercelDeployButtonUrl({
        dataproxy: false,
        repositoryOwner: 'some-repo-owner',
        repositoryHandle: 'some-repo',
      })
    ).toMatchSnapshot()
  })
})
