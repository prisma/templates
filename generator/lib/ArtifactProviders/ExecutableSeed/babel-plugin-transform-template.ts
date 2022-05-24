import * as Babel from '@babel/core'
import { transformedPrismaSchemaContentEnvironmentVariableName } from '~/src/utils'

/**
 * A Babel plugin that transforms the seed scripts in templates to make them executable at runtime in Cloud
 *
 * In Cloud, we do not write files to disk and do not generate Prisma Client for the user, so we cannot just
 * run `prisma db seed` to seed the user's DB. Instead, we use @prisma-spectrum/reflector, which
 * generates an in-memory version of the Prisma Client. This babel plugin replaces usage of `@prisma/client`
 * with this prisma instance.
 *
 * Specifically, here's what it does:
 *
 * 1. Removes the `PrismaClient` import from the `@prisma/client` module. This is mostly cleanup, since we
 * know no one in the transformed script will use it
 *
 * 2. Adds a `import { Reflector } from '@prisma-spectrum/reflector';` statement at the top of the file.
 *
 * 3. Replaces all instances of `const variable = new PrismaClient()` with:
 * ```
 * const variable = await Reflector.Client.getPrismaClient({
 *   useDataProxy: true,
 *   connectionString,
 *   schema: {
 *     contents: process.env.TRANSFORMED_PRISMA_SCHEMA_CONTENT,
 *     path: "/tmp/schema.prisma",
 *   },
 * })
 * const prisma = await new variable();
 * ```
 *
 * The rest of the file can remain the same.
 *
 * @example
 *
 * For input
 * ```
 * import { Prisma, PrismaClient } from '@prisma/client'
 *
 * const prisma = new PrismaClient()
 *
 * await prisma.user.findMany()
 * ```
 *
 * This outputs:
 * ```
 * import { Reflector } from '@prisma-spectrum/reflector';
 *
 * const PrismaClient = await Reflector.Client.getPrismaClient({
 *   useDataProxy: true,
 *   connectionString,
 *   schema: {
 *     contents: process.env.TRANSFORMED_PRISMA_SCHEMA_CONTENT,
 *     path: "/tmp/schema.prisma",
 *   },
 * })
 *
 * const prisma = await new PrismaClient();
 *
 * await prisma.user.findMany()
 * ```
 *
 */

export type BabelPluginTransformTemplateOptions = {
  schema: {
    content: string
    path: string
    datasourceUrlEnvironmentVariableName: string
    transformedPrismaSchemaContentEnvironmentVariableName: string
  }
}

export function babelPluginTransformTemplate(
  options: BabelPluginTransformTemplateOptions
): (BabelPluginTransformTemplateOptions | (() => Babel.PluginItem))[] {
  return [
    (): Babel.PluginItem => {
      return {
        visitor: {
          Program(path) {
            // Add a `import { Reflector } from '@prisma-spectrum/reflector';` at the top of the file
            path.node.body.unshift(
              Babel.types.importDeclaration(
                [
                  Babel.types.importSpecifier(
                    Babel.types.identifier('Reflector'),
                    Babel.types.identifier('Reflector')
                  ),
                ],
                Babel.types.stringLiteral('@prisma-spectrum/reflector')
              )
            )

            // Add a `import path from "path"` at the top of the file
            path.node.body.unshift(
              Babel.types.importDeclaration(
                [Babel.types.importDefaultSpecifier(Babel.types.identifier('path'))],
                Babel.types.stringLiteral('path')
              )
            )
          },
          ImportSpecifier(path) {
            // Remove the `PrismaClient` import from "@prisma/client" if it exists
            if (path.node.imported.type === 'Identifier' && path.node.imported.name === 'PrismaClient') {
              path.remove()
            }

            // Since we removed an import from `@prisma/client`, check to see if that emptied out the import (AKA something like `import "@prisma/client")
            // If so, delete the import entirely.

            const importDeclaration = path.parent as Babel.types.ImportDeclaration

            if (
              importDeclaration.source.value === '@prisma/client' &&
              importDeclaration.specifiers.length === 0
            ) {
              path.parentPath.remove()
            }
          },
          VariableDeclaration(path) {
            /**
             * Find the `const variable = new PrismaClient` expression and remove it.
             */

            if (
              path.node.declarations[0]?.id.type === 'Identifier' &&
              path.node.declarations[0]?.init?.type === 'NewExpression'
            ) {
              const variableConstructor = path.node.declarations[0].init.callee

              if (variableConstructor.type !== 'Identifier' || variableConstructor.name !== 'PrismaClient') {
                return
              }
              path.remove()
            }
          },
          FunctionDeclaration(
            path,
            {
              opts: {
                schema: { datasourceUrlEnvironmentVariableName, path: schemaPath },
              },
            }: { opts: BabelPluginTransformTemplateOptions }
          ) {
            /**
             * Find `async function main() {` and insert after:
             * ```
             *  const PrismaClient = await Reflector.Client.getPrismaClient({
             *  useDataProxy: true,
             *  connectionString,
             *  schema: {
             *    contents: process.env.TRANSFORMED_PRISMA_SCHEMA_CONTENT,
             *    path: "/tmp/schema.prisma",
             *  },
             *});
             * ```
             */
            path.node.body.body.unshift(
              Babel.types.variableDeclaration('const', [
                Babel.types.variableDeclarator(
                  Babel.types.identifier('PrismaClient'),
                  Babel.types.awaitExpression(
                    Babel.types.newExpression(
                      Babel.types.memberExpression(
                        Babel.types.identifier('Reflector.Client'),
                        Babel.types.identifier('getPrismaClient')
                      ),
                      [
                        Babel.types.objectExpression([
                          Babel.types.objectProperty(
                            Babel.types.identifier(`useDataProxy`),
                            Babel.types.booleanLiteral(true)
                          ),
                          Babel.types.objectProperty(
                            Babel.types.identifier(`connectionString`),
                            Babel.types.identifier(`process.env.${datasourceUrlEnvironmentVariableName}`)
                          ),
                          Babel.types.objectProperty(
                            Babel.types.identifier('schema'),
                            Babel.types.objectExpression([
                              Babel.types.objectProperty(
                                Babel.types.identifier('contents'),
                                Babel.types.identifier(
                                  `process.env.${transformedPrismaSchemaContentEnvironmentVariableName}`
                                )
                              ),
                              Babel.types.objectProperty(
                                Babel.types.identifier('path'),
                                Babel.types.identifier(`"${schemaPath}"`)
                              ),
                            ])
                          ),
                        ]),
                      ]
                    )
                  )
                ),
              ]),
              //  Add `const prisma = await new PrismaClient();`
              Babel.types.variableDeclaration('const', [
                Babel.types.variableDeclarator(
                  Babel.types.identifier('prisma'),
                  Babel.types.awaitExpression(
                    Babel.types.newExpression(Babel.types.identifier('PrismaClient'), [])
                  )
                ),
              ])
            )
          },
          AwaitExpression(path) {
            // Remove prisma.$disconnect(); because it causes an error in the script
            if (
              path.node.argument.type === 'CallExpression' &&
              path.node.argument.callee.type === 'MemberExpression' &&
              path.node.argument.callee.property.type === 'Identifier' &&
              path.node.argument.callee.property.name === '$disconnect'
            ) {
              path.remove()
            }
          },
        },
      }
    },
    options,
  ]
}
