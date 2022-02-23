import glob from 'fast-glob'
import { camelCase, snakeCase, upperFirst } from 'lodash'
import * as Path from 'path'

export type Handle = {
  jsdoc: string
  value: string
}

export type TemplateInfo = {
  handles: {
    kebab: Handle
    camel: Handle
    snake: Handle
    pascal: Handle
    upper: Handle
  }
  displayName: string
  description: string
  path: string
}

/**
 * TODO
 */
export const getTemplateInfos = (params: { templatesRepoDir: string }): TemplateInfo[] => {
  return glob.sync(`${params.templatesRepoDir}/*`, { onlyDirectories: true, dot: false }).map((path) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { name, description } = require(`${path}/package.json`) as { name: string; description: string }

    const handles = {
      kebab: {
        jsdoc: `Good for URLs, npm package name.`,
        value: name,
      },
      pascal: {
        jsdoc: `Good for class names, type names.`,
        value: upperFirst(camelCase(name)),
      },
      camel: {
        jsdoc: `Good for object properties.`,
        value: camelCase(name),
      },
      snake: {
        jsdoc: `Good for enums, constants.`,
        value: snakeCase(name).toLowerCase(),
      },
      upper: {
        jsdoc: `Good for environment names, constants.`,
        value: snakeCase(name).toUpperCase(),
      },
    }

    return {
      handles,
      displayName: Path.basename(path),
      description,
      path,
    }
  })
}
