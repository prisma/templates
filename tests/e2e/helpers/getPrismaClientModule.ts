import { PrismaClient } from '@prisma/client/scripts/default-index'
import { PrismaClientOptions } from '@prisma/client/runtime'

export type PrismaClientConstructor = new (options: PrismaClientOptions) => PrismaClient

export function getPrismaClientModule(
  baseModulePath: string
): Promise<{ PrismaClient: PrismaClientConstructor }> {
  return import(`${baseModulePath}/node_modules/@prisma/client`)
}
