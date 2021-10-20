import { merge } from 'lodash'
import { inspect } from 'util'
import { previewFeaturesPattern, PreviewFlag } from '../data/prisma'
import { BaseTemplateParametersResolved, File } from '../types'
import { Index, mapValues } from '../utils'

export type Tools = {
  /**
   * Replace content in the given file.
   *
   * This does a simple string.replace but will throw an error if the given pattern does not match anything.
   */
  replaceContent(params: { file: File; pattern: RegExp; replacement: string }): string
  /**
   * Tools for working with JSON files
   */
  json: {
    /**
     * Deep merge an object into a JSON file. Uses Lodash merge.
     *
     * The file is automatically deserialized and re-serialized after the data merge.
     */
    merge(params: { file: File; data: Record<string, unknown> }): string
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
    addPreviewFlag(params: { file: File; previewFlag: PreviewFlag }): string
  }
}

export type Params = {
  file: File
  parameters: BaseTemplateParametersResolved
  tools: Tools
}

export type FileTransformer = (params: Params) => string

export const runStack = <T extends Index<File>>(
  transformers: FileTransformer[],
  files: T,
  parameters: Params['parameters']
): T => {
  return mapValues(files, (file) => {
    const contentTransformed = transformers.reduce((content, transformer) => {
      return transformer({
        file: {
          ...file,
          content,
        },
        parameters,
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
    addPreviewFlag(params) {
      if (previewFeaturesPattern.exec(params.file.content)) {
        return tools.replaceContent({
          file: params.file,
          pattern: /previewFeatures(.*)=(.*)\[(.+)]/,
          replacement: `previewFeatures$1=$2[$3, "${params.previewFlag}"]`,
        })
      } else {
        return tools.replaceContent({
          file: params.file,
          pattern: /(provider *= *"prisma-client-js")/,
          replacement: `$1\n  previewFeatures = ["${params.previewFlag}"]`,
        })
      }
    },
  },
}
