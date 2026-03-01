// ============================================
// Prisma Implementation of IDatabaseService
// ============================================
// This is the ONLY file (besides prisma.ts) that imports @prisma/client.
// To swap DB engines: create a new implementation + change the export in index.ts.

import type { PrismaClient } from "@prisma/client";
import type { IDatabaseService, DatabaseClient } from "./db.interfaces";
import { prisma } from "./prisma";

class PrismaDatabaseService implements IDatabaseService {
  constructor(private readonly prismaClient: PrismaClient) {}

  /**
   * Expose the Prisma client as a generic DatabaseClient.
   * Repositories access `db.client.user`, `db.client.const`, etc.
   */
  get client(): DatabaseClient {
    return this.prismaClient as unknown as DatabaseClient;
  }

  /**
   * Run multiple operations in a single transaction.
   *
   * Usage:
   *   const result = await db.transaction(async (tx) => {
   *     const userRepo = new UserRepository(tx);
   *     const user = await userRepo.create(data);
   *     return user;
   *   });
   */
  async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T> {
    return this.prismaClient.$transaction((tx) =>
      fn(tx as unknown as DatabaseClient),
    );
  }

  /**
   * Verify the database connection is alive.
   * Called once at server startup.
   */
  async healthCheck(): Promise<void> {
    await this.prismaClient.$connect();
    await this.prismaClient.$queryRaw`SELECT 1`;
  }

  /**
   * Graceful disconnect — call during shutdown.
   */
  async disconnect(): Promise<void> {
    await this.prismaClient.$disconnect();
  }
}

/** Singleton database service instance. */
export const db: IDatabaseService = new PrismaDatabaseService(prisma);
