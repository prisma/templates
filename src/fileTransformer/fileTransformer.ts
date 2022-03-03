import { merge } from 'lodash'
import { inspect } from 'util'
import { Reflector } from '@prisma-spectrum/reflector'
import { PrismaTemplates } from '../'
import { BaseTemplateParametersResolved, File } from '../types'
import { Index, mapValues } from '../utils'

type Tool<Params> = (params: { file: File } & Params) => string

export type Tools = {
  /**
   * Replace content in the given file.
   *
   * This does a simple string.replace but will throw an error if the given pattern does not match anything.
   */
  replaceContent: Tool<{ pattern: RegExp; replacement: string }>
  /**
   * Tools for working with JSON files
   */
  json: {
    /**
     * Deep merge an object into a JSON file. Uses Lodash merge.
     *
     * The file is automatically deserialized and re-serialized after the data merge.
     */
    merge: Tool<{ data: Record<string, unknown> }>
  }
  /**
   * Tools designed specifically for working with Prisma Schema.
   */
  prismaSchema: {
    /**
     * Add a preview flag to the Prisma Client generator block.
     *
     * Upsert semantics are used: If preview flags are already present then this one is appended. If there are no preview flags yet then the preview flags field is added.
     */
    addPreviewFeatureFlag: Tool<{
      file: File
      PreviewFeatureFlag: Reflector.Schema.PreviewFeatureFlag
    }>
    /**
     * Set the referentialIntegrity datasource setting.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
     */
    setReferentialIntegrity: Tool<{ value: Reflector.Schema.ReferentialIntegritySettingValue }>
  }
}

export type Params = {
  template: PrismaTemplates.$Types.TemplateTag
  file: File
  parameters: BaseTemplateParametersResolved
  tools: Tools
}

export type FileTransformer = (params: Params) => string

export const runStack = <T extends Index<File>>(params: {
  template: PrismaTemplates.$Types.TemplateTag
  transformers: FileTransformer[]
  files: T
  parameters: Params['parameters']
}): T => {
  return mapValues(params.files, (file) => {
    const contentTransformed = params.transformers.reduce((content, transformer) => {
      return transformer({
        template: params.template,
        file: {
          ...file,
          content,
        },
        parameters: params.parameters,
        tools,
      })
    }, file.content)

    return {
      ...file,
      content: contentTransformed,
    }
  }) as T
}

const tools: Tools = {
  replaceContent(params) {
    const { pattern, file, replacement } = params

    if (!pattern.exec(file.content)) {
      throw new Error(
        `Pattern ${String(pattern)} does not match on file: ${inspect(file, { depth: 10, colors: true })}`
      )
    }

    return file.content.replace(pattern, replacement)
  },
  json: {
    merge(params) {
      const data = JSON.parse(params.file.content) as Record<string, unknown>
      const data_ = merge(data, params.data)
      const json = JSON.stringify(data_, null, 2)
      return json
    },
  },
  prismaSchema: {
    addPreviewFeatureFlag(params) {
      return Reflector.Schema.addPreviewFeatureFlag({
        previewFlag: params.PreviewFeatureFlag,
        prismaSchemaContent: params.file.content,
      })
    },
    setReferentialIntegrity(params) {
      return Reflector.Schema.setReferentialIntegrity({
        value: params.value,
        prismaSchemaContent: params.file.content,
      })
    },
  },
}
