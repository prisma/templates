import { Generated } from '../generated'
import { BaseTemplateParametersResolved, File } from '../types'
import { capitalize, Index, mapValues } from '../utils'

/**
 * Build the given template with given parameters.
 */
export const create = <TemplateName extends Generated.Types.TemplateNames>(
  templateName: TemplateName,
  parameters: Generated.Types.TemplateParmetersByName[TemplateName]
): Generated.Types.TemplateByName[TemplateName] => {
  const Template = Generated.Templates[capitalize(templateName)]
  //eslint-disable-next-line
  return new Template(parameters) as any
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

  return content
}

export const transformers = [prismaSchemaProviderTransformer]

// Template Transformers System

type TransformerParams = { file: File; parameters: BaseTemplateParametersResolved }

type FileTransformer = (params: TransformerParams) => string

export const runFileTransformers = <T extends Index<File>>(
  transformers: FileTransformer[],
  files: T,
  parameters: TransformerParams['parameters']
): T => {
  return mapValues(files, (file) => {
    return {
      ...file,
      content: transformers.reduce((content, transformer) => {
        return transformer({
          file: {
            ...file,
            content,
          },
          parameters,
        })
      }, file.content),
    }
  }) as T
}
