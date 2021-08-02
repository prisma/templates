import { BaseTemplateParametersResolved, File } from '../types'
import { Index, mapValues } from '../utils'

export type Params = {
  file: File
  parameters: BaseTemplateParametersResolved
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
      })
    }, file.content)

    return {
      ...file,
      content: contentTransformed,
    }
  }) as T
}
