import { PrismaClient } from '@prisma/client'
import { log } from 'floggy'

export async function initPostgresDatabase(prismaAdminClient: PrismaClient, databaseName: string) {
  try {
    return prismaAdminClient.$executeRawUnsafe(`create database ${databaseName}`)
  } catch (e) {
    log.info(`Error initialising DB ${databaseName}`)
  }
}
