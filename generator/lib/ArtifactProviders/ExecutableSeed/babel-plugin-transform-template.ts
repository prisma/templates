import * as Babel from '@babel/core'

/**
 * A Babel plugin that transforms @prisma/client calls with @prisma/stuio-pcw calls.
 * This is used during Cloud template build to generate seed scripts that can be executed at runtime.
 *
 * @example
 *
 * For input
 * ```
 * import { PrismaClient } from '@prisma/client'
 *
 * const prisma = new PrismaClient()
 * ```
 *
 * This outputs:
 * ```
 * import { PCW } from '@prisma/studio-pcw'
 *
 * const pcw = new PCW("schema-string", schemaPath);
 * const prisma = await pcw.getPrismaClient()
 * ```
 *
 * ASSUMPTIONS:
 * 1. Only one `@prisma/client` import exists
 * 2. Only `PrismaClient` is imported from `@prisma/client`, and nothing else
 * 3. There must be a named (not renamed) function export called `seed` (Option 2,2 in https://www.prisma.io/docs/guides/database/seed-database#requirements-for-seeding-with-typescript-or-javascript)
 * 4. `PrismaClient` must be constructed inside the seed function.
 * 5. The variable name of the PrismaClient instance must be `prisma`
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
          ImportDeclaration(path) {
            // Find the `@prisma/client` import and replace it with a `@prisma/studio-pcw` import
            // ASSUMPTIONS 1,2 apply

            if (path.node.source.value === '@prisma/client') {
              path.replaceWith(
                Babel.types.importDeclaration(
                  [Babel.types.importSpecifier(Babel.types.identifier('PCW'), Babel.types.identifier('PCW'))],
                  Babel.types.stringLiteral('@prisma/studio-pcw')
                )
              )
            }
          },

          ExportNamedDeclaration(path, params: { opts: BabelPluginTransformTemplateOptions }) {
            const {
              opts: {
                schema: { content: schemaContent, path: schemaPath },
              },
            } = params
            // Find named export called `seed`. This can be either
            // 1. `export async function seed() {}`
            // 2. `async function seed() {}; export { seed }`
            // Only handle (1) here. (2) is not supported.
            // ASSUMPTION 3

            if (
              path.node.declaration?.type === 'FunctionDeclaration' &&
              path.node.declaration.id?.name === 'seed'
            ) {
              // Add global `const schema = "..."`
              path.insertBefore(
                Babel.types.variableDeclaration('const', [
                  Babel.types.variableDeclarator(
                    Babel.types.identifier('schema'),
                    Babel.types.identifier('`' + schemaContent + '`')
                  ),
                ])
              )
              // Add global `const schemaPath = "..."`
              path.insertBefore(
                Babel.types.variableDeclaration('const', [
                  Babel.types.variableDeclarator(
                    Babel.types.identifier('schemaPath'),
                    Babel.types.stringLiteral(schemaPath)
                  ),
                ])
              )

              // Call the seed() function
              path.insertAfter(
                Babel.types.callExpression(
                  Babel.types.arrowFunctionExpression(
                    [],
                    Babel.types.awaitExpression(
                      Babel.types.callExpression(Babel.types.identifier('seed'), [])
                    ),
                    true
                  ),
                  []
                )
              )
            }
          },

          VariableDeclaration(
            path,
            {
              opts: {
                schema: { datasourceUrlEnvironmentVariableName },
              },
            }: { opts: BabelPluginTransformTemplateOptions }
          ) {
            // Find the `const variable = new PrismaClient` expression and replace it with:
            // ```
            // const pcw = new PCW(...);
            // const variable = await pcw.getPrismaClient()
            // ```

            if (
              path.node.declarations[0]?.id.type === 'Identifier' &&
              path.node.declarations[0]?.init?.type === 'NewExpression'
            ) {
              // If variable declaration is an expression with the `new` keyword
              const variableName = path.node.declarations[0].id.name // ASSUMPTION 5 dictates that this will be `prisma`
              const variableConstructor = path.node.declarations[0].init.callee

              if (variableConstructor.type === 'Identifier' && variableConstructor.name === 'PrismaClient') {
                // ASSUMPTION 4

                // Replace with `const pcw = new PCW(...)
                path.replaceWith(
                  Babel.types.variableDeclaration('const', [
                    Babel.types.variableDeclarator(
                      Babel.types.identifier('pcw'),
                      Babel.types.newExpression(Babel.types.identifier('PCW'), [
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
                                    Babel.types.identifier('require'),
                                    Babel.types.identifier('resolve')
                                  ),
                                  [Babel.types.stringLiteral('.prisma/client')]
                                )
                              ),
                            ])
                          ),
                        ]),
                      ])
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
            }
          },
        },
      }
    },
    options,
  ]
}
