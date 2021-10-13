import { inspect } from 'util'
import { BaseTemplateParametersResolved, File } from '../types'
import { Index, mapValues } from '../utils'

export type Tools = {
  /**
   * Replace content in the given file.
   *
   * This does a simple string.replace but will throw an error if the given pattern does not match anything.
   */
  replaceContent(params: { file: File; pattern: RegExp; replacement: string }): string
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
}
