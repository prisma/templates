export const PrismaDatasourceProviderName = {
  mysql: 'mysql',
  postgresql: 'postgresql',
  sqlserver: 'sqlserver',
  sqlite: 'sqlite',
  mongodb: 'mongodb',
} as const

export type PrismaDatasourceProviderName = keyof typeof PrismaDatasourceProviderName

export type EngineType = 'library' | 'binary' | 'dataproxy'

export const previewFeaturesPattern = /previewFeatures *= *\[/

export const previewFlags = {
  mongoDb: 'mongoDb',
  dataproxy: 'dataproxy',
} as const

export type PreviewFlag = keyof typeof previewFlags
