import { PrismaClient } from '@prisma/client'

export async function initPostgresDatabase(prismaAdminClient: PrismaClient, databaseName: string) {
  return prismaAdminClient.$executeRawUnsafe(`create database ${databaseName}`)
}
