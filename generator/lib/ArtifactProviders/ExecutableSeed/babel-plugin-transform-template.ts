import * as Babel from '@babel/core'

/**
 * A Babel plugin that transforms the seed scripts in templates to make them executable at runtime in Cloud
 *
 * In Cloud, we do not write files to disk and do not generate Prisma Client for the user, so we cannot just
 * run `prisma db seed` to seed the user's DB. Instead, we use the `@prisma/studio-pcw` package, which
 * generates an in-memory version of the Prisma Client. This babel plugin replaces usage of `@prisma/client`
 * with `@prisma/studio-pcw`.
 *
 * Specifically, here's what it does:
 *
 * 1. Removes the `PrismaClient` import from the `@prisma/client` module. This is mostly cleanup, since we
 * know no one in the transformed script will use it
 *
 * 2. Adds a `import PCW from "@prisma/studio-pcw"` statement at the top of the file. (PCW is CommonJS)
 *
 * 3. Adds a `import path from "path"` statement at the top of the file.
 *
 * 4. Replaces all instances of `const variable = new PrismaClient()` with:
 * ```
 * const schema = '...';
 * const schemaPath = '...';
 * const pcw = new PCW.PCW('...');
 * const variable = await pcw.getPrismaClient()
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
 * import PCW from '@prisma/studio-pcw'
 * import { Prisma } from '@prisma/client'
 *
 * const pcw = new PCW.PCW(
 *  "schema-string",
 *  schemaPath,
 *  { dbEnvVar: "" },
 *  { resolve: { ".prisma/client": path.join(process.env(), "node_modules/.prisma/client") }
 * });
 * const prisma = await pcw.getPrismaClient()
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
            // Add a `import PCW from "@prisma/studio-pcw"` at the top of the file
            path.node.body.unshift(
              Babel.types.importDeclaration(
                [Babel.types.importDefaultSpecifier(Babel.types.identifier('PCW'))],
                Babel.types.stringLiteral('@prisma/studio-pcw')
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

          VariableDeclaration(
            path,
            {
              opts: {
                schema: { datasourceUrlEnvironmentVariableName, content: schemaContent, path: schemaPath },
              },
            }: { opts: BabelPluginTransformTemplateOptions }
          ) {
            /**
             * Find the `const variable = new PrismaClient` expression and replace it with:
             *
             * ```
             * const schema = '...'
             * const schemaPath = '...'
             * const pcw = new PCW.PCW(
             *   schema,
             *   schemaPath,
             *   { envVarName: process.env.envVarName }
             * );
             * const variable = await pcw.getPrismaClient()
             * ```
             */

            if (
              path.node.declarations[0]?.id.type === 'Identifier' &&
              path.node.declarations[0]?.init?.type === 'NewExpression'
            ) {
              // If variable declaration is an expression with the `new` keyword
              const variableName = path.node.declarations[0].id.name
              const variableConstructor = path.node.declarations[0].init.callee

              if (variableConstructor.type !== 'Identifier' || variableConstructor.name !== 'PrismaClient') {
                return
              }

              // Add variable definition `const schema = "..."` ( so we can use it in the PCW constructor below)
              path.insertBefore(
                Babel.types.variableDeclaration('const', [
                  Babel.types.variableDeclarator(
                    Babel.types.identifier('schema'),
                    Babel.types.identifier('`' + schemaContent + '`')
                  ),
                ])
              )
              // Add variable definition `const schemaPath = "..."` ( so we can use it in the PCW constructor below)
              path.insertBefore(
                Babel.types.variableDeclaration('const', [
                  Babel.types.variableDeclarator(
                    Babel.types.identifier('schemaPath'),
                    Babel.types.stringLiteral(schemaPath)
                  ),
                ])
              )

              //
              /**
               * Replace with:
               * ```
               * const pcw = new PCW.PCW(
               *   schema,
               *   schemaPath,
               *   { envVarName: "..." },
               *   { resolve: { ".prisma/client": path.join(process.cwd(), "node_modules/.prisma/client") } }
               * )
               * ```
               */
              path.replaceWith(
                Babel.types.variableDeclaration('const', [
                  Babel.types.variableDeclarator(
                    Babel.types.identifier('pcw'),
                    Babel.types.newExpression(
                      Babel.types.memberExpression(
                        Babel.types.identifier('PCW'),
                        Babel.types.identifier('PCW')
                      ),
                      [
                        Babel.types.identifier('schema'), // There will be a global defined with this name via the `ExportNamedDeclaration` visitor
                        Babel.types.identifier('schemaPath'), // There will be a global defined with this name via the `ExportNamedDeclaration` visitor
                        Babel.types.objectExpression([
                          Babel.types.objectProperty(
                            Babel.types.identifier(datasourceUrlEnvironmentVariableName),
                            Babel.types.identifier(`process.env.${datasourceUrlEnvironmentVariableName}`)
                          ),
                        ]),
                        Babel.types.objectExpression([
                          Babel.types.objectProperty(
                            Babel.types.identifier('forcePrismaLibrary'),
                            Babel.types.booleanLiteral(true)
                          ),
                          Babel.types.objectProperty(
                            Babel.types.identifier('resolve'),
                            Babel.types.objectExpression([
                              Babel.types.objectProperty(
                                Babel.types.stringLiteral('.prisma/client'),
                                Babel.types.callExpression(
                                  Babel.types.memberExpression(
                                    Babel.types.identifier('path'),
                                    Babel.types.identifier('join')
                                  ),
                                  [
                                    Babel.types.callExpression(
                                      Babel.types.memberExpression(
                                        Babel.types.identifier('process'),
                                        Babel.types.identifier('cwd')
                                      ),
                                      []
                                    ),
                                    Babel.types.stringLiteral('node_modules/.prisma/client'),
                                  ]
                                )
                              ),
                            ])
                          ),
                        ]),
                      ]
                    )
                  ),
                ])
              )

              // Add `const prisma = await pcw.getPrismaClient();`
              path.insertAfter(
                Babel.types.variableDeclaration('const', [
                  Babel.types.variableDeclarator(
                    Babel.types.objectPattern([
                      Babel.types.objectProperty(
                        Babel.types.identifier(variableName),
                        Babel.types.identifier(variableName)
                      ),
                    ]),
                    Babel.types.awaitExpression(
                      Babel.types.callExpression(
                        Babel.types.memberExpression(
                          Babel.types.identifier('pcw'),
                          Babel.types.identifier('getPrismaClient')
                        ),
                        []
                      )
                    )
                  ),
                ])
              )
            }
          },
        },
      }
    },
    options,
  ]
}
