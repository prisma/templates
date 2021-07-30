// https://regex101.com/r/dUmmIu/1
export const datasourceUrlPattern = /(.*datasource.*{*url\s*=\s*env\(")([^"]+)("\).*)/s

export function setSchemaDatasourceUrlEnvarName(schema: string, envarName: string): string {
  return schema.replace(datasourceUrlPattern, `$1${envarName}$3`)
}

export const datasourceUrlEnvironmentVariableName = `PRISMA_CLOUD_PROJECT_DATASOURCE_URL`
