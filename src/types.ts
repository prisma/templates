import { Data } from './data'
import { EngineType } from './data/prisma'
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
  /**
   * The repository owner to use for the deploy to vercel button in the template's README.md.
   *
   * @default '??'
   */
  repositoryOwner?: string | null
  /**
   * The repository name to use for the deploy to vercel button in the template's README.md.
   *
   * @default '??'
   */
  repositoryHandle?: string | null
  /**
   * The PSL prisma client generator block engineType setting.
   *
   * @default '??'
   */
  engineType?: EngineType | null
}

export type BaseTemplateParametersResolved = Required<BaseTemplateParameters>
