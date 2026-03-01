import { BaseService } from "@core/base";
import { ConflictError } from "@core/errors";
import { R } from "@shared/i18n";
import type { UserRepository } from "./user.repository";
import type { CreateUserDto, UpdateUserDto, User } from "./user.types";

export class UserService extends BaseService<User, CreateUserDto, UpdateUserDto, UserRepository> {
  constructor(repo: UserRepository) {
    super(repo, R.USER);
  }

  // Override: add email uniqueness check
  async create(data: CreateUserDto): Promise<User> {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) throw new ConflictError(R.USER, "email", data.email);
    return this.repo.create(data);
  }

  // Override: add email uniqueness check on update
  async update(id: string, data: UpdateUserDto): Promise<User> {
    await this.getById(id);

    if (data.email) {
      const existing = await this.repo.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new ConflictError(R.USER, "email", data.email);
      }
    }

    return this.repo.update(id, data);
  }
}
