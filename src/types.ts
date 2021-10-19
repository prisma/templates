import { Data } from './data'
import { EngineType } from './data/prisma'
import { Index } from './utils'

export * from './generated/types'

export abstract class AbstractTemplate<
  FilesIndex extends Index<File> = Index<File>,
  ArtifactsIndex extends Index<File> = Index<File>
> {
  public abstract metadata: {
    handles: {
      pascal: string
      camel: string
      kebab: string
      upper: string
      snake: string
    }
    displayName: string
    githubUrl: null | string
    description: string
  }
  public abstract files: FilesIndex
  public abstract artifacts: ArtifactsIndex
}

export type File = {
  content: string
  path: string
}

export type BaseTemplateParameters = {
  /**
   * The datasource provider to use in the Prisma Schema.
   *
   * @default 'postgresql'
   */
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
   * If `null` then omitted, thus using the Prisma default.
   *
   * @default null
   */
  engineType?: EngineType | null
}

export type BaseTemplateParametersResolved = Required<BaseTemplateParameters>
