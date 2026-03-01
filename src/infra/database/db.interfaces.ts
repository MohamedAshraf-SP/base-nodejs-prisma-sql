// ============================================
// Database Contracts (DB-engine agnostic)
// ============================================
// These interfaces define what ANY database engine must implement.
// Only `infra/database/` knows the actual engine (Prisma, TypeORM, etc.).
// Everything else (core/, apis/, shared/) depends on these contracts.

/**
 * ModelDelegate — generic interface for a single database model.
 *
 * Mirrors the subset of Prisma model delegates used by BaseRepository.
 * Any new DB engine adapter must implement these methods per model.
 */
export interface ModelDelegate {
  findMany(args?: any): Promise<any>;
  findUnique(args?: any): Promise<any>;
  create(args?: any): Promise<any>;
  update(args?: any): Promise<any>;
  delete(args?: any): Promise<any>;
  count(args?: any): Promise<any>;
}

/**
 * DatabaseClient — a map of model names to their delegates.
 *
 * Usage:  `db.client.user`  → ModelDelegate for the User table
 *         `db.client.const` → ModelDelegate for the Const table
 */
export interface DatabaseClient {
  [modelName: string]: ModelDelegate;
}

/**
 * IDatabaseService — top-level database service contract.
 *
 * Provides:
 *   - `client`       → access model delegates
 *   - `transaction`  → run multiple operations atomically
 *   - `healthCheck`  → verify the connection is alive
 *   - `disconnect`   → graceful shutdown
 */
export interface IDatabaseService {
  readonly client: DatabaseClient;
  transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T>;
  healthCheck(): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * PaginationOptions — passed to repository findAll() for paginated queries.
 */
export interface PaginationOptions {
  page: number;
  limit?: number;
}
