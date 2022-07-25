import { PrismaClient } from '@prisma/client'

export async function dropPostgresDatabase(prismaAdminClient: PrismaClient, databaseName: string) {
  try {
    await prismaAdminClient.$executeRawUnsafe(`DROP DATABASE ${databaseName} WITH (FORCE);`)
  } catch (error) {
    const isDatabaseNotFoundErorr = error instanceof Error && error.message.match(/does not exist/)
    if (!isDatabaseNotFoundErorr) throw error
  } finally {
    await prismaAdminClient.$disconnect()
  }
}
