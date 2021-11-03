export const DatasourceProviderName = {
  mysql: 'mysql',
  postgresql: 'postgresql',
  sqlserver: 'sqlserver',
  sqlite: 'sqlite',
  mongodb: 'mongodb',
} as const

export type DatasourceProviderName = keyof typeof DatasourceProviderName

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
 */
export const ReferentialIntegritySettingValue = {
  prisma: 'prisma',
  foreignKeys: 'foreignKeys',
} as const

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
 */
export type ReferentialIntegritySettingValue = keyof typeof ReferentialIntegritySettingValue

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
 */
export const referentialIntegritySettingValueDefault = ReferentialIntegritySettingValue.foreignKeys

export const EngineType = {
  library: 'library',
  binary: 'binary',
}

export type EngineType = keyof typeof EngineType

export const previewFeaturesPattern = /previewFeatures *= *\[/

export const PreviewFlag = {
  mongoDb: 'mongoDb',
  dataproxy: 'dataproxy',
  /**
   * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
   */
  referentialIntegrity: 'referentialIntegrity',
} as const

export type PreviewFlag = keyof typeof PreviewFlag
