export const PrismaDatasourceProviderName = {
  mysql: 'mysql',
  postgresql: 'postgresql',
  sqlserver: 'sqlserver',
  sqlite: 'sqlite',
} as const

export type PrismaDatasourceProviderName = keyof typeof PrismaDatasourceProviderName
