/**
 * Avoid instantiating too many instances of Prisma, especially in development.
 *
 * @link https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices#problem
 */

import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  const g = global as any
  if (!g.prisma) g.prisma = new PrismaClient()
  prisma = g.prisma
}

export { prisma }
