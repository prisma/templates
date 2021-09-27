import { Data } from './data'
import { Generated } from './generated'
import { Index } from './utils'

export * from './generated/types'

export abstract class AbstractTemplate<
  // eslint-disable-next-line
  Name extends Generated.Types.TemplateNames = any,
  FilesIndex extends Index<File> = Index<File>,
  ArtifactsIndex extends Index<File> = Index<File>
> {
  public abstract metadata: {
    name: Name
    displayName: string
    githubUrl: null | string
  }
  public abstract files: FilesIndex
  public abstract artifacts: ArtifactsIndex
}

export type File = {
  content: string
  path: string
}

export type BaseTemplateParameters = {
  datasourceProvider?: Data.PrismaDatasourceProviderName
  repositoryOwner?: string | null
  repositoryHandle?: string | null
}

export type BaseTemplateParametersResolved = Required<BaseTemplateParameters>
