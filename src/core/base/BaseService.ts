import type { BaseRepository } from "./BaseRepository";
import type { PaginationOptions } from "@infra/database";
import type { PaginatedResult } from "@shared/types";
import { NotFoundError } from "@core/errors";
import type { TranslationKey } from "@shared/i18n";

/**
 * Base service with standard CRUD business logic.
 *
 * Generics:
 *   T         - Entity type
 *   CreateDto - Shape for creation
 *   UpdateDto - Shape for updates
 *   R         - Concrete repository type (so subclasses can access custom repo methods)
 *
 * Usage:
 *   class UserService extends BaseService<User, CreateUserDto, UpdateUserDto, UserRepository> {
 *     constructor(repo: UserRepository) {
 *       super(repo, "resources.user");
 *     }
 *   }
 */
export class BaseService<
  T,
  CreateDto,
  UpdateDto,
  R extends BaseRepository<T, CreateDto, UpdateDto> = BaseRepository<T, CreateDto, UpdateDto>,
> {
  constructor(
    protected readonly repo: R,
    readonly resourceKey: TranslationKey,
  ) {}

  /** Get all records (no pagination). */
  async getAll(): Promise<T[]> {
    return this.repo.findAll();
  }

  /** Get records with pagination. */
  async getAllPaginated(options: PaginationOptions): Promise<PaginatedResult<T>> {
    return this.repo.findAllPaginated(options);
  }

  async getById(id: string): Promise<T> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundError(this.resourceKey);
    return item;
  }

  async create(data: CreateDto): Promise<T> {
    return this.repo.create(data);
  }

  async update(id: string, data: UpdateDto): Promise<T> {
    await this.getById(id);
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<T> {
    await this.getById(id);
    return this.repo.remove(id);
  }
}
