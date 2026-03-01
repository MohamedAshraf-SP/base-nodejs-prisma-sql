import type { ModelDelegate, PaginationOptions } from "@infra/database";
import type { PaginatedResult } from "@shared/types";

// ============================================
// Repository Options
// ============================================
export interface RepositoryOptions {
  /** Enable soft deletes (sets deletedAt instead of removing the row). Default: false */
  softDelete?: boolean;
}

/**
 * Base repository with standard CRUD operations.
 *
 * Features:
 *   - Pagination via findAllPaginated()
 *   - Opt-in soft deletes (sets `deletedAt` instead of DELETE)
 *   - `defaultOrder` — subclasses set once, applied to all queries automatically
 *   - `where()` helper — merges baseFilter with extra conditions (soft-delete safe)
 *   - DB-engine agnostic (depends on ModelDelegate, not Prisma)
 *
 * Generics:
 *   T         - Entity type (e.g., User)
 *   CreateDto - Shape for creating a record
 *   UpdateDto - Shape for updating a record
 *
 * Usage:
 *   class UserRepository extends BaseRepository<User, CreateUserDto, UpdateUserDto> {
 *     protected defaultOrder = { createdAt: "desc" };
 *     constructor(db: DatabaseClient) {
 *       super(db.user, { softDelete: true });
 *     }
 *   }
 */
export class BaseRepository<T, CreateDto, UpdateDto> {
  private readonly softDelete: boolean;

  /** Override in subclass to set default ordering for findAll / findAllPaginated. */
  protected defaultOrder?: Record<string, string>;

  constructor(
    protected readonly model: ModelDelegate,
    options?: RepositoryOptions,
  ) {
    this.softDelete = options?.softDelete ?? false;
  }

  // ============================================
  // Helpers (soft-delete safe)
  // ============================================

  /** Base filter that auto-excludes soft-deleted rows. */
  protected get baseFilter(): Record<string, any> {
    return this.softDelete ? { deletedAt: null } : {};
  }

  /**
   * Merge baseFilter with extra conditions. Use in custom queries
   * so soft-deleted rows are always excluded automatically.
   *
   * Usage:
   *   async findByEmail(email: string) {
   *     return this.model.findUnique({ where: this.where({ email }) });
   *   }
   */
  protected where(extra?: Record<string, any>): Record<string, any> {
    return { ...this.baseFilter, ...extra };
  }

  // ============================================
  // READ
  // ============================================

  /** Get all records (no pagination). */
  async findAll(): Promise<T[]> {
    return this.model.findMany({
      where: this.baseFilter,
      ...(this.defaultOrder && { orderBy: this.defaultOrder }),
    });
  }

  /** Get records with pagination. */
  async findAllPaginated(options: PaginationOptions): Promise<PaginatedResult<T>> {
    const where = this.baseFilter;
    const page = options.page;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        ...(this.defaultOrder && { orderBy: this.defaultOrder }),
      }),
      this.model.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: this.where({ id }) });
  }

  // ============================================
  // CREATE
  // ============================================
  async create(data: CreateDto): Promise<T> {
    return this.model.create({ data });
  }

  // ============================================
  // UPDATE
  // ============================================
  async update(id: string, data: UpdateDto): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  // ============================================
  // DELETE
  // ============================================

  /** Soft delete (if enabled) or hard delete. */
  async remove(id: string): Promise<T> {
    if (this.softDelete) {
      return this.model.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }
    return this.model.delete({ where: { id } });
  }

  /** Always hard-delete, regardless of softDelete setting. */
  async forceRemove(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }

  // ============================================
  // COUNT
  // ============================================
  async count(): Promise<number> {
    return this.model.count({ where: this.baseFilter });
  }
}