import { PrismaUtils } from '@prisma/utils'
import { MigrationSql } from './logic'
import { Index } from './utils'

export * from './generated/types'

export abstract class AbstractTemplate<
  FilesIndex extends Index<File> = Index<File>,
  ArtifactsIndex extends Index<File> = Index<File>
> {
  public abstract _tag: string
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
  public abstract migrationSql: MigrationSql.MigrationSql
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
  datasourceProvider?: PrismaUtils.Schema.DatasourceProviderNormalized
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
  engineType?: PrismaUtils.Engines.EmbedStrategy | null
  /**
   * Is Prisma Dataproxy being used?
   *
   * @default true
   */
  dataproxy?: boolean
  /**
   * The PSL prisma client generator block referentialIntegrity setting.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
   * @remarks When the default is used, no changes to the PSL are made since this is the Prisma default.
   * @default 'foreignKeys'
   */
  referentialIntegrity?: PrismaUtils.Schema.ReferentialIntegritySettingValue
}

export type BaseTemplateParametersResolved = Required<BaseTemplateParameters>
