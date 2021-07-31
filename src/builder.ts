import { BaseTemplateParametersResolved, BuildTemplate, File, Template } from './types'
import { Index, mapValues } from './utils'

/**
 * Build the given template with given parameters.
 */
export const build = <T extends Template>(
  template: T,
  parameters: GlobalPrismaTemplateParameters[T['metadata']['name']]
): BuildTemplate<T> => {
  const parameters_ = {
    ...parameters,
    ...template.Parameters.defaults,
  }

  return {
    ...template,
    files: runFileTransformers(transformers, template.files, parameters_),
  }
}

// Template Transformers

const prismaSchemaProviderTransformer: FileTransformer = (params) => {
  const { file, parameters } = params

  let content = file.content

  if (file.path === 'prisma/schema.prisma') {
    content = content.replace(`provider = "postgresql"`, `provider = "${parameters.datasourceProvider}"`)

    if (parameters.datasourceProvider === 'sqlserver') {
      content = content.replace(
        `provider = "prisma-client-js"`,
        `provider = "prisma-client-js"
  previewFeatures = ["microsoftSqlServer"]`
      )
    }
  }

  return {
    ...file,
    content,
  }
}

const transformers = [prismaSchemaProviderTransformer]

// Template Transformers System

type TransformerParams = { file: File; parameters: BaseTemplateParametersResolved }

type FileTransformer = (params: TransformerParams) => File

const runFileTransformers = (
  transformers: FileTransformer[],
  files: Index<File>,
  parameters: TransformerParams['parameters']
) => {
  return mapValues(files, (file) => {
    return {
      ...file,
      content: transformers.reduce((file, transformer): File => {
        return transformer({
          file,
          parameters,
        })
      }, file),
    }
  })
}
