import { Data } from './Data'
import { Generated } from './generated'
import { Index } from './utils'

export type Template<
  // eslint-disable-next-line
  Name extends TemplateNames = any,
  FilesIndex extends Index<File> = Index<File>,
  ArtifactsIndex extends Index<File> = Index<File>,
  Parameters extends BaseTemplateParameters = BaseTemplateParameters
> = {
  metadata: {
    name: Name
    displayName: string
    githubUrl: null | string
  }
  files: FilesIndex
  artifacts: ArtifactsIndex
  Parameters: {
    defaults: Parameters
  }
}

export type BuildTemplate<T extends Template> = {
  metadata: {
    name: T['metadata']['name']
    displayName: string
    githubUrl: null | string
  }
  files: T['files']
  artifacts: T['artifacts']
}

export type BuiltTemplate<
  // eslint-disable-next-line
  Name extends TemplateNames = any,
  FilesIndex extends Index<File> = Index<File>,
  ArtifactsIndex extends Index<File> = Index<File>
> = {
  metadata: {
    name: Name
    displayName: string
    githubUrl: null | string
  }
  files: FilesIndex
  artifacts: ArtifactsIndex
}

export type TemplateNames =
  | Generated.empty.Metadata.Name
  | Generated.musicStreamingService.Metadata.Name
  | Generated.rentalsPlatform.Metadata.Name
  | Generated.saas.Metadata.Name
  | Generated.urlShortener.Metadata.Name

export type File = {
  content: string
  path: string
}

export type BaseTemplateParameters = {
  datasourceProvider?: Data.PrismaDatasourceProviderName
}

export type BaseTemplateParametersResolved = Required<BaseTemplateParameters>
